<?php

namespace Doingfb\AdSlot\Support;

use Carbon\Carbon;
use Doingfb\AdSlot\Model\DiscountCode;
use Doingfb\AdSlot\Model\Item;
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

        $allowedGroupIds = $this->settings->getDiscountEnabledGroupIds();

        if ($allowedGroupIds === []) {
            return false;
        }

        return count(array_intersect($this->getActorGroupIds($actor), $allowedGroupIds)) > 0;
    }

    public function generateForActor(User $actor): DiscountCode
    {
        if (!$this->canActorGenerate($actor)) {
            throw new ValidationException(['message' => '当前账号没有生成优惠码的权限。']);
        }

        return $this->createCode(
            $actor->id,
            $this->settings->getDefaultDiscountAmount(),
            $this->settings->getDefaultDiscountValidDays(),
            $this->settings->getDiscountEnabledGroupIds()
        );
    }

    /**
     * @param int[]|null $allowedGroupIds
     */
    public function generateForAdmin(User $actor, ?float $amount = null, ?int $validDays = null, ?array $allowedGroupIds = null): DiscountCode
    {
        if (!$actor->isAdmin()) {
            throw new ValidationException(['message' => '只有管理员可以手动生成优惠码。']);
        }

        return $this->createCode(
            $actor->id,
            $amount ?? $this->settings->getDefaultDiscountAmount(),
            $validDays ?? $this->settings->getDefaultDiscountValidDays(),
            $allowedGroupIds
        );
    }

    /**
     * @return array{discountCode:?DiscountCode,adFeeAmount:float,discountAmount:float,payableAmount:float}
     */
    public function resolveSubmission(?string $codeValue, User $actor, ?Item $item = null, bool $bypassEligibility = false): array
    {
        $adFeeAmount = $this->settings->getBaseMonthlyFee();
        $normalizedCode = trim((string) $codeValue);

        if ($normalizedCode === '') {
            return [
                'discountCode' => null,
                'adFeeAmount' => $adFeeAmount,
                'discountAmount' => 0.0,
                'payableAmount' => $adFeeAmount,
            ];
        }

        $discountCode = DiscountCode::query()
            ->where('code', $normalizedCode)
            ->first();

        if (!$discountCode) {
            throw new ValidationException(['message' => '优惠码不存在或不可用。']);
        }

        if ((bool) $discountCode->is_used) {
            $sameItem = $item && (int) $discountCode->used_item_id === (int) $item->id;

            if (!$sameItem) {
                throw new ValidationException(['message' => '该优惠码已被使用，不能重复提交。']);
            }
        }

        $now = Carbon::now();

        if ($discountCode->starts_at && $discountCode->starts_at->greaterThan($now)) {
            throw new ValidationException(['message' => '优惠码尚未生效。']);
        }

        if ($discountCode->expires_at && $discountCode->expires_at->lessThan($now)) {
            throw new ValidationException(['message' => '优惠码已过期。']);
        }

        if (!$bypassEligibility && !$this->canActorUseCode($actor, $discountCode)) {
            throw new ValidationException(['message' => '当前账号不能使用这个优惠码。']);
        }

        $discountAmount = min($adFeeAmount, max(0, round((float) $discountCode->amount, 2)));

        return [
            'discountCode' => $discountCode,
            'adFeeAmount' => $adFeeAmount,
            'discountAmount' => $discountAmount,
            'payableAmount' => max(0, round($adFeeAmount - $discountAmount, 2)),
        ];
    }

    public function bindToItem(?DiscountCode $discountCode, Item $item): void
    {
        if (!$discountCode) {
            return;
        }

        $discountCode->is_used = true;
        $discountCode->used_by = $item->user_id;
        $discountCode->used_item_id = $item->id;
        $discountCode->used_at = Carbon::now();
        $discountCode->save();
    }

    protected function canActorUseCode(User $actor, DiscountCode $discountCode): bool
    {
        if ($actor->isAdmin()) {
            return true;
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
    protected function createCode(int $createdBy, float $amount, int $validDays, ?array $allowedGroupIds): DiscountCode
    {
        $startsAt = Carbon::now();
        $expiresAt = (clone $startsAt)->addDays(max(1, $validDays));

        $model = new DiscountCode();
        $model->code = $this->generateUniqueCode();
        $model->amount = max(0, round($amount, 2));
        $model->starts_at = $startsAt;
        $model->expires_at = $expiresAt;
        $model->allowed_group_ids = $allowedGroupIds !== null
            ? array_values(array_unique(array_filter(array_map('intval', $allowedGroupIds), fn ($id) => $id > 0)))
            : [];
        $model->created_by = $createdBy;
        $model->is_used = false;
        $model->save();

        return $model;
    }

    protected function generateUniqueCode(): string
    {
        do {
            $code = strtoupper((string) random_int(10000000, 99999999));
        } while (DiscountCode::query()->where('code', $code)->exists());

        return $code;
    }

    /**
     * @return int[]
     */
    protected function getActorGroupIds(User $actor): array
    {
        return array_values(array_unique(array_map('intval', $actor->groups()->pluck('id')->all())));
    }
}
