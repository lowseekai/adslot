<?php

namespace Doingfb\AdSlot\Support;

use Doingfb\AdSlot\Model\DiscountCode;
use Doingfb\AdSlot\Model\Item;
use Doingfb\AdSlot\Model\ItemRenewal;
use Flarum\Foundation\ValidationException;
use Flarum\User\User;

class DiscountCodeService
{
    public function __construct(
        protected AdSlotSettings $settings
    ) {
    }

    public function canActorGenerate(User $actor): bool
    {
        if ($actor->isAdmin()) {
            return true;
        }

        if (!$this->isActorInEnabledGroups($actor)) {
            $this->invalidateOwnedCodes($actor);

            return false;
        }

        return true;
    }

    public function generateForActor(User $actor): DiscountCode
    {
        if (!$this->canActorGenerate($actor)) {
            throw new ValidationException(['message' => '当前账号没有生成优惠码的权限。']);
        }

        $this->pruneActiveOwnedCodes($actor, $this->settings->getPersonalDiscountCodeLimit());

        return $this->createCode(
            $actor->id,
            $this->settings->getDefaultDiscountAmount(),
            $this->settings->getDefaultDiscountValidDays(),
            $this->settings->getDiscountEnabledGroupIds(),
            $actor->id
        );
    }

    public function generateForAdmin(User $actor, ?float $amount = null, ?int $validDays = null, int $usageLimit = 1, ?int $durationMonths = null): DiscountCode
    {
        return $this->generateBatchForAdmin($actor, $amount, $validDays, 1, $usageLimit, $durationMonths)[0];
    }

    /**
     * @return DiscountCode[]
     */
    public function generateBatchForAdmin(User $actor, ?float $amount = null, ?int $validDays = null, int $quantity = 1, int $usageLimit = 1, ?int $durationMonths = null): array
    {
        if (!$actor->isAdmin()) {
            throw new ValidationException(['message' => '只有管理员可以手动生成优惠码。']);
        }

        $quantity = min(100, max(1, $quantity));
        $usageLimit = min(1000, max(1, $usageLimit));
        $durationMonths = $this->normalizeDurationRestriction($durationMonths);
        $amount = $amount ?? $this->settings->getDefaultDiscountAmount();
        $validDays = $validDays ?? $this->settings->getDefaultDiscountValidDays();
        $codes = [];

        // 使用事务确保批量生成的原子性，失败时全部回滚
        DiscountCode::query()->getConnection()->transaction(function () use ($actor, $amount, $validDays, $quantity, $usageLimit, $durationMonths, &$codes) {
            for ($i = 0; $i < $quantity; $i++) {
                $codes[] = $this->createCode(
                    $actor->id,
                    $amount,
                    $validDays,
                    // Admin-generated codes are intentionally available to all registered users.
                    null,
                    null,
                    'alnum',
                    $usageLimit,
                    $durationMonths
                );
            }
        });

        return $codes;
    }

    /**
     * 规范化折扣码字符串，统一处理空格
     */
    protected function normalizeDiscountCode(?string $code): string
    {
        return trim((string) $code);
    }

    /**
     * @return array{discountCode:?DiscountCode,adFeeAmount:float,discountAmount:float,payableAmount:float,isApplicable:bool,message:string,durationMonths:?int,durationLabel:string}
     */
    public function previewSubmission(?string $codeValue, User $actor, int $durationMonths = 1): array
    {
        $durationMonths = $this->normalizeSubmissionDuration($durationMonths);
        $adFeeAmount = round($this->settings->getBaseMonthlyFee() * $durationMonths, 2);
        $normalizedCode = $this->normalizeDiscountCode($codeValue);
        $base = [
            'discountCode' => null,
            'adFeeAmount' => $adFeeAmount,
            'discountAmount' => 0.0,
            'payableAmount' => $adFeeAmount,
            'isApplicable' => false,
            'message' => '',
            'durationMonths' => null,
            'durationLabel' => $this->durationRestrictionLabel(null),
        ];

        if ($normalizedCode === '') {
            return $base;
        }

        $discountCode = DiscountCode::query()
            ->where('code', $normalizedCode)
            ->first();

        if (!$discountCode) {
            return array_merge($base, ['message' => '优惠码不存在或不可用。']);
        }

        $restrictedDurationMonths = $this->restrictedDurationMonths($discountCode);
        $base['discountCode'] = $discountCode;
        $base['durationMonths'] = $restrictedDurationMonths;
        $base['durationLabel'] = $this->durationRestrictionLabel($restrictedDurationMonths);

        $message = $this->discountCodeValidationMessage($discountCode, $actor, $durationMonths);

        if ($message !== null) {
            return array_merge($base, ['message' => $message]);
        }

        $discountAmount = min($adFeeAmount, max(0, round((float) $discountCode->amount, 2)));

        return array_merge($base, [
            'discountAmount' => $discountAmount,
            'payableAmount' => max(0, round($adFeeAmount - $discountAmount, 2)),
            'isApplicable' => true,
            'message' => $restrictedDurationMonths
                ? sprintf('该优惠码仅限 %s投放使用，当前选择可抵扣 %s 元。', $this->durationRestrictionLabel($restrictedDurationMonths), number_format($discountAmount, 2, '.', ''))
                : sprintf('该优惠码可用于当前投放时长，可抵扣 %s 元。', number_format($discountAmount, 2, '.', '')),
        ]);
    }

    /**
     * @return array{discountCode:?DiscountCode,adFeeAmount:float,discountAmount:float,payableAmount:float}
     */
    public function resolveSubmission(?string $codeValue, User $actor, int $durationMonths = 1, ?Item $item = null, bool $bypassEligibility = false): array
    {
        $durationMonths = $this->normalizeSubmissionDuration($durationMonths);
        $adFeeAmount = round($this->settings->getBaseMonthlyFee() * $durationMonths, 2);
        $normalizedCode = $this->normalizeDiscountCode($codeValue);

        if ($normalizedCode === '') {
            return [
                'discountCode' => null,
                'adFeeAmount' => $adFeeAmount,
                'discountAmount' => 0.0,
                'payableAmount' => $adFeeAmount,
            ];
        }

        // 使用行锁防止竞态条件
        $discountCode = DiscountCode::query()
            ->where('code', $normalizedCode)
            ->lockForUpdate()
            ->first();

        if (!$discountCode) {
            throw new ValidationException(['message' => '优惠码不存在或不可用。']);
        }

        $alreadyBoundToItem = $item
            && trim((string) $item->discount_code) === $normalizedCode;
        $sameLastUsedItem = $item
            && (int) $discountCode->used_item_id === (int) $item->id;

        // 在锁保护下重新检查使用次数，防止竞态条件
        if ($this->isUsageExhausted($discountCode) && !$alreadyBoundToItem && !$sameLastUsedItem) {
            throw new ValidationException(['message' => '该优惠码可使用次数已用完，不能继续提交。']);
        }

        $now = AdSlotTime::now();

        if ($discountCode->starts_at && $discountCode->starts_at->greaterThan($now)) {
            throw new ValidationException(['message' => '优惠码尚未生效。']);
        }

        // 使用 lessThan 而非 lessThanOrEqualTo，给予1秒宽限期，避免边界情况下的不一致体验
        if ($discountCode->expires_at && $discountCode->expires_at->lessThan($now)) {
            throw new ValidationException(['message' => '优惠码已过期。']);
        }

        if (!$bypassEligibility && !$this->canActorUseCode($actor, $discountCode)) {
            throw new ValidationException(['message' => '当前账号不能使用这个优惠码。']);
        }

        $durationMessage = $this->durationRestrictionMessage($discountCode, $durationMonths);

        if ($durationMessage !== null) {
            throw new ValidationException(['message' => $durationMessage]);
        }

        $discountAmount = min($adFeeAmount, max(0, round((float) $discountCode->amount, 2)));

        return [
            'discountCode' => $discountCode,
            'adFeeAmount' => $adFeeAmount,
            'discountAmount' => $discountAmount,
            'payableAmount' => max(0, round($adFeeAmount - $discountAmount, 2)),
        ];
    }

    public function bindToItem(?DiscountCode $discountCode, Item $item, bool $alreadyBound = false): void
    {
        if (!$discountCode) {
            return;
        }

        $this->markCodeUsed($discountCode, (int) $item->user_id, (int) $item->id, !$alreadyBound);
    }

    public function bindToRenewal(?DiscountCode $discountCode, ItemRenewal $renewal): void
    {
        if (!$discountCode) {
            return;
        }

        $this->markCodeUsed($discountCode, (int) $renewal->user_id, (int) $renewal->item_id);
    }

    public function syncActorEligibility(User $actor): void
    {
        if ($actor->isAdmin()) {
            return;
        }

        if (!$this->isActorInEnabledGroups($actor)) {
            $this->invalidateOwnedCodes($actor);
        }
    }

    protected function canActorUseCode(User $actor, DiscountCode $discountCode): bool
    {
        if ($actor->isAdmin()) {
            return true;
        }

        if ($discountCode->owner_user_id !== null) {
            if ((int) $discountCode->owner_user_id !== (int) $actor->id) {
                return false;
            }

            if (!$this->isActorInEnabledGroups($actor)) {
                $this->invalidateDiscountCode($discountCode);

                return false;
            }
        }

        $allowedGroupIds = array_values(array_filter(array_map('intval', $discountCode->allowed_group_ids ?? [])));

        if ($allowedGroupIds === []) {
            return true;
        }

        return count(array_intersect($this->getActorGroupIds($actor), $allowedGroupIds)) > 0;
    }

    /**
     * @param int[]|null $allowedGroupIds
     */
    protected function createCode(int $createdBy, float $amount, int $validDays, ?array $allowedGroupIds, ?int $ownerUserId, string $format = 'numeric', int $usageLimit = 1, ?int $durationMonths = null): DiscountCode
    {
        $startsAt = AdSlotTime::now();
        $expiresAt = (clone $startsAt)->addDays(max(1, $validDays));
        $durationMonths = $this->normalizeDurationRestriction($durationMonths);

        $model = new DiscountCode();
        $model->code = $this->generateUniqueCode($format);
        $model->amount = max(0, round($amount, 2));
        $model->starts_at = $startsAt;
        $model->expires_at = $expiresAt;
        $model->allowed_group_ids = $allowedGroupIds !== null
            ? array_values(array_unique(array_filter(array_map('intval', $allowedGroupIds), fn ($id) => $id > 0)))
            : [];
        $model->created_by = $createdBy;
        $model->owner_user_id = $ownerUserId;
        $model->usage_limit = min(1000, max(1, $usageLimit));
        $model->used_count = 0;
        $model->duration_months = $durationMonths;
        $model->is_used = false;
        $model->save();

        return $model;
    }

    protected function markCodeUsed(DiscountCode $discountCode, int $userId, int $itemId, bool $countUsage = true): void
    {
        $usageLimit = $this->usageLimit($discountCode);
        $usedCount = $this->usedCount($discountCode);

        if ($countUsage && $usedCount < $usageLimit) {
            $usedCount++;
        }

        $discountCode->used_count = min($usageLimit, max(0, $usedCount));
        $discountCode->is_used = $discountCode->used_count >= $usageLimit;
        $discountCode->used_by = $userId;
        $discountCode->used_item_id = $itemId;
        $discountCode->used_at = AdSlotTime::now();
        $discountCode->save();
    }

    protected function isUsageExhausted(DiscountCode $discountCode): bool
    {
        return $this->usedCount($discountCode) >= $this->usageLimit($discountCode);
    }

    public function durationRestrictionLabel(?int $durationMonths): string
    {
        return $durationMonths ? sprintf('%d 个月', $durationMonths) : '不限投放时长';
    }

    protected function discountCodeValidationMessage(DiscountCode $discountCode, User $actor, int $durationMonths, ?Item $item = null, bool $bypassEligibility = false): ?string
    {
        $alreadyBoundToItem = $item
            && trim((string) $item->discount_code) === trim((string) $discountCode->code);
        $sameLastUsedItem = $item
            && (int) $discountCode->used_item_id === (int) $item->id;

        if ($this->isUsageExhausted($discountCode) && !$alreadyBoundToItem && !$sameLastUsedItem) {
            return '该优惠码可使用次数已用完，不能继续提交。';
        }

        $now = AdSlotTime::now();

        if ($discountCode->starts_at && $discountCode->starts_at->greaterThan($now)) {
            return '优惠码尚未生效。';
        }

        // 使用 lessThan 而非 lessThanOrEqualTo，给予1秒宽限期
        if ($discountCode->expires_at && $discountCode->expires_at->lessThan($now)) {
            return '优惠码已过期。';
        }

        if (!$bypassEligibility && !$this->canActorUseCode($actor, $discountCode)) {
            return '当前账号不能使用这个优惠码。';
        }

        return $this->durationRestrictionMessage($discountCode, $durationMonths);
    }

    protected function durationRestrictionMessage(DiscountCode $discountCode, int $durationMonths): ?string
    {
        $restrictedDurationMonths = $this->restrictedDurationMonths($discountCode);

        if ($restrictedDurationMonths && $restrictedDurationMonths !== $durationMonths) {
            return sprintf(
                '该优惠码仅限 %s投放使用，请切换投放时长后再使用。',
                $this->durationRestrictionLabel($restrictedDurationMonths)
            );
        }

        return null;
    }

    protected function normalizeSubmissionDuration(int $durationMonths): int
    {
        return in_array($durationMonths, ItemValidator::ALLOWED_DURATION_MONTHS, true) ? $durationMonths : 1;
    }

    protected function normalizeDurationRestriction(?int $durationMonths): ?int
    {
        $durationMonths = (int) ($durationMonths ?? 0);

        return in_array($durationMonths, ItemValidator::ALLOWED_DURATION_MONTHS, true) ? $durationMonths : null;
    }

    protected function restrictedDurationMonths(DiscountCode $discountCode): ?int
    {
        return $this->normalizeDurationRestriction((int) ($discountCode->duration_months ?? 0));
    }

    protected function usageLimit(DiscountCode $discountCode): int
    {
        return max(1, (int) ($discountCode->usage_limit ?? 1));
    }

    protected function usedCount(DiscountCode $discountCode): int
    {
        $usedCount = (int) ($discountCode->used_count ?? 0);

        if ($usedCount <= 0 && (bool) $discountCode->is_used) {
            return 1;
        }

        return max(0, $usedCount);
    }

    protected function generateUniqueCode(string $format = 'numeric'): string
    {
        $maxAttempts = 100;
        $attempts = 0;

        do {
            $code = $format === 'alnum'
                ? $this->generateAlnumCode()
                : strtoupper((string) random_int(10000000, 99999999));
            $attempts++;

            if ($attempts >= $maxAttempts) {
                throw new ValidationException(['message' => '无法生成唯一折扣码，请稍后重试。']);
            }
        } while (DiscountCode::query()->where('code', $code)->exists());

        return $code;
    }

    protected function generateAlnumCode(int $length = 10): string
    {
        $letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        $numbers = '23456789';
        $pool = $letters . $numbers;
        $chars = [
            $letters[random_int(0, strlen($letters) - 1)],
            $numbers[random_int(0, strlen($numbers) - 1)],
        ];

        for ($i = count($chars); $i < max(2, $length); $i++) {
            $chars[] = $pool[random_int(0, strlen($pool) - 1)];
        }

        for ($i = count($chars) - 1; $i > 0; $i--) {
            $j = random_int(0, $i);
            [$chars[$i], $chars[$j]] = [$chars[$j], $chars[$i]];
        }

        return implode('', $chars);
    }

    protected function isActorInEnabledGroups(User $actor): bool
    {
        $allowedGroupIds = $this->settings->getDiscountEnabledGroupIds();

        if ($allowedGroupIds === []) {
            return false;
        }

        return count(array_intersect($this->getActorGroupIds($actor), $allowedGroupIds)) > 0;
    }

    /**
     * @return int[]
     */
    protected function getActorGroupIds(User $actor): array
    {
        return array_values(array_unique(array_map('intval', $actor->groups()->pluck('id')->all())));
    }

    protected function pruneActiveOwnedCodes(User $actor, int $limit): void
    {
        $keepCount = max(0, $limit - 1);
        $activeCodes = $this->activeOwnedCodesQuery($actor)
            ->orderByDesc('created_at')
            ->get();

        if ($activeCodes->count() <= $keepCount) {
            return;
        }

        $activeCodes
            ->slice($keepCount)
            ->each(fn (DiscountCode $code) => $this->invalidateDiscountCode($code));
    }

    protected function invalidateOwnedCodes(User $actor): void
    {
        $this->activeOwnedCodesQuery($actor)
            ->get()
            ->each(fn (DiscountCode $code) => $this->invalidateDiscountCode($code));
    }

    protected function activeOwnedCodesQuery(User $actor)
    {
        $now = AdSlotTime::now();

        return DiscountCode::query()
            ->where('owner_user_id', $actor->id)
            ->where('is_used', false)
            ->where(function ($query) use ($now) {
                $query->whereNull('expires_at')
                    ->orWhere('expires_at', '>', $now);
            });
    }

    protected function invalidateDiscountCode(DiscountCode $discountCode): void
    {
        $expiredAt = AdSlotTime::now()->subSecond();

        $discountCode->expires_at = $expiredAt;
        $discountCode->save();
    }
}
