<?php

namespace Doingfb\AdSlot\Api\Controller;

use Doingfb\AdSlot\Model\DiscountCode;
use Doingfb\AdSlot\Model\Item;
use Doingfb\AdSlot\Support\AdSlotTime;
use Flarum\Http\RequestUtil;
use Flarum\User\User;
use Laminas\Diactoros\Response\JsonResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

class AdminListDiscountCodesController implements RequestHandlerInterface
{
    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $actor = RequestUtil::getActor($request);
        $actor->assertAdmin();

        $params = $request->getQueryParams();
        $page = is_array($params['page'] ?? null) ? $params['page'] : [];
        $status = (string) ($params['status'] ?? '');
        $keyword = trim((string) ($params['q'] ?? ''));
        $limit = min(max((int) ($page['limit'] ?? $params['limit'] ?? 10), 1), 50);
        $offset = max((int) ($page['offset'] ?? $params['offset'] ?? 0), 0);
        $now = AdSlotTime::now();

        $query = DiscountCode::query()->orderByDesc('created_at');

        if ($keyword !== '') {
            $query->where('code', 'like', '%'.$keyword.'%');
        }

        if ($status === 'used') {
            $query->where(function ($query) {
                $query->where('is_used', true)
                    ->orWhereColumn('used_count', '>=', 'usage_limit');
            });
        } elseif ($status === 'available') {
            $query->where('is_used', false)
                ->whereColumn('used_count', '<', 'usage_limit')
                ->where(function ($query) use ($now) {
                    $query->whereNull('expires_at')
                        ->orWhere('expires_at', '>', $now);
                });
        } elseif ($status === 'expired') {
            $query->where('is_used', false)
                ->whereColumn('used_count', '<', 'usage_limit')
                ->whereNotNull('expires_at')
                ->where('expires_at', '<=', $now);
        }

        $total = (clone $query)->count();
        $codes = $query->offset($offset)->limit($limit)->get();
        $users = $this->loadUsers($codes);
        $items = $this->loadItems($codes);

        return new JsonResponse([
            'data' => $codes->map(fn (DiscountCode $code) => $this->serializeCode($code, $users, $items))->values(),
            'meta' => [
                'total' => $total,
                'limit' => $limit,
                'offset' => $offset,
                'hasMore' => ($offset + $limit) < $total,
                'page' => (int) floor($offset / max($limit, 1)) + 1,
                'totalPages' => (int) ceil($total / max($limit, 1)),
            ],
        ]);
    }

    protected function loadUsers($codes): array
    {
        $ids = [];

        foreach ($codes as $code) {
            foreach ([$code->created_by, $code->owner_user_id, $code->used_by] as $id) {
                if ($id) {
                    $ids[] = (int) $id;
                }
            }
        }

        if ($ids === []) {
            return [];
        }

        return User::query()
            ->whereIn('id', array_values(array_unique($ids)))
            ->get(['id', 'username'])
            ->keyBy('id')
            ->all();
    }

    protected function loadItems($codes): array
    {
        $ids = $codes
            ->pluck('used_item_id')
            ->filter()
            ->map(fn ($id) => (int) $id)
            ->unique()
            ->values();

        if ($ids->isEmpty()) {
            return [];
        }

        return Item::query()
            ->whereIn('id', $ids)
            ->get(['id', 'merchant_name'])
            ->keyBy('id')
            ->all();
    }

    protected function serializeCode(DiscountCode $code, array $users, array $items): array
    {
        $usageLimit = max(1, (int) ($code->usage_limit ?? 1));
        $usedCount = max(0, (int) ($code->used_count ?? ((bool) $code->is_used ? 1 : 0)));
        $isFullyUsed = $usedCount >= $usageLimit;
        $isExpired = !$isFullyUsed && $code->expires_at && $code->expires_at->lessThanOrEqualTo(AdSlotTime::now());
        $status = $isFullyUsed ? 'used' : ($isExpired ? 'expired' : 'available');

        return [
            'id' => $code->id,
            'code' => $code->code,
            'amount' => (float) $code->amount,
            'startsAt' => AdSlotTime::atom($code->starts_at),
            'expiresAt' => AdSlotTime::atom($code->expires_at),
            'validDays' => AdSlotTime::displayDiffInDays($code->starts_at, $code->expires_at),
            'createdAt' => AdSlotTime::atom($code->created_at),
            'usedAt' => AdSlotTime::atom($code->used_at),
            'isUsed' => $isFullyUsed,
            'isExpired' => (bool) $isExpired,
            'status' => $status,
            'usageLimit' => $usageLimit,
            'usedCount' => $usedCount,
            'durationMonths' => $code->duration_months ? (int) $code->duration_months : null,
            'durationLabel' => $this->durationRestrictionLabel($code->duration_months ? (int) $code->duration_months : null),
            'allowedGroupIds' => $code->allowed_group_ids ?? [],
            'createdBy' => $this->serializeUser($users[(int) $code->created_by] ?? null),
            'ownerUser' => $this->serializeUser($users[(int) $code->owner_user_id] ?? null),
            'usedBy' => $this->serializeUser($users[(int) $code->used_by] ?? null),
            'usedItem' => $this->serializeItem($items[(int) $code->used_item_id] ?? null),
        ];
    }

    protected function serializeUser(?User $user): ?array
    {
        if (!$user) {
            return null;
        }

        return [
            'id' => $user->id,
            'username' => $user->username,
            'displayName' => $user->display_name,
        ];
    }

    protected function durationRestrictionLabel(?int $durationMonths): string
    {
        return $durationMonths ? sprintf('%d 个月', $durationMonths) : '不限投放时长';
    }

    protected function serializeItem(?Item $item): ?array
    {
        if (!$item) {
            return null;
        }

        return [
            'id' => $item->id,
            'merchantName' => $item->merchant_name,
        ];
    }
}
