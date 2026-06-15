<?php

namespace Doingfb\AdSlot\Support;

use Carbon\CarbonInterface;
use Doingfb\AdSlot\Model\DiscountCode;
use Doingfb\AdSlot\Model\DiscountGroupGrant;
use Doingfb\AdSlot\Model\Item;
use Doingfb\AdSlot\Model\ItemRenewal;
use Flarum\Group\Group;
use Flarum\User\Event\GroupsChanged;
use Flarum\User\User;
use Illuminate\Contracts\Events\Dispatcher;

class DiscountGroupGrantService
{
    protected const FORBIDDEN_GRANT_GROUP_IDS = [
        Group::GUEST_ID,
        Group::ADMINISTRATOR_ID,
        Group::MEMBER_ID,
        Group::MODERATOR_ID,
    ];

    public function __construct(
        protected Dispatcher $events
    ) {
    }

    public function grantForApprovedItem(Item $item): ?Group
    {
        $discountCode = $this->findDiscountCode($item->discount_code);
        $group = $discountCode
            ? $this->findGrantableGroup((int) ($discountCode->grant_group_id ?? 0))
            : null;

        if (!$discountCode || !$group || !$item->ends_at) {
            return null;
        }

        return $this->storeGrant(
            (int) $item->user_id,
            (int) $group->id,
            (int) $item->id,
            null,
            (int) $discountCode->id,
            $item->starts_at ?: AdSlotTime::now(),
            $item->ends_at
        ) ? $group : null;
    }

    public function grantForApprovedRenewal(ItemRenewal $renewal): ?Group
    {
        $discountCode = $this->findDiscountCode($renewal->discount_code);
        $group = $discountCode
            ? $this->findGrantableGroup((int) ($discountCode->grant_group_id ?? 0))
            : null;
        $item = $renewal->item;
        $endsAt = $renewal->new_ends_at ?: ($item ? $item->ends_at : null);

        if (!$discountCode || !$group || !$endsAt) {
            return null;
        }

        return $this->storeGrant(
            (int) $renewal->user_id,
            (int) $group->id,
            (int) $renewal->item_id,
            (int) $renewal->id,
            (int) $discountCode->id,
            $renewal->reviewed_at ?: AdSlotTime::now(),
            $endsAt
        ) ? $group : null;
    }

    public function revokeExpired(?CarbonInterface $now = null): int
    {
        $now = $now ?: AdSlotTime::now();
        $count = 0;

        DiscountGroupGrant::query()
            ->whereNull('revoked_at')
            ->whereNotNull('ends_at')
            ->where('ends_at', '<=', $now)
            ->orderBy('id')
            ->chunkById(100, function ($grants) use ($now, &$count) {
                foreach ($grants as $grant) {
                    if ($this->revokeGrant($grant, $now)) {
                        $count++;
                    }
                }
            });

        return $count;
    }

    public function revokeActiveForItem(Item $item, ?CarbonInterface $now = null): int
    {
        $now = $now ?: AdSlotTime::now();
        $count = 0;

        DiscountGroupGrant::query()
            ->where('item_id', (int) $item->id)
            ->whereNull('revoked_at')
            ->orderBy('id')
            ->chunkById(100, function ($grants) use ($now, &$count) {
                foreach ($grants as $grant) {
                    if ($this->revokeGrant($grant, $now)) {
                        $count++;
                    }
                }
            });

        return $count;
    }

    public function revokeActiveForDiscountCode(DiscountCode $discountCode, ?CarbonInterface $now = null): int
    {
        $now = $now ?: AdSlotTime::now();
        $count = 0;

        DiscountGroupGrant::query()
            ->where('discount_code_id', (int) $discountCode->id)
            ->whereNull('revoked_at')
            ->orderBy('id')
            ->chunkById(100, function ($grants) use ($now, &$count) {
                foreach ($grants as $grant) {
                    if ($this->revokeGrant($grant, $now)) {
                        $count++;
                    }
                }
            });

        return $count;
    }

    public function isGrantableGroupId(int $groupId): bool
    {
        return (bool) $this->findGrantableGroup($groupId);
    }

    protected function storeGrant(int $userId, int $groupId, int $itemId, ?int $renewalId, int $discountCodeId, CarbonInterface $startsAt, CarbonInterface $endsAt): bool
    {
        if ($endsAt->lessThanOrEqualTo(AdSlotTime::now())) {
            return false;
        }

        $user = User::query()->find($userId);

        if (!$user || !$this->isGrantableGroupId($groupId)) {
            return false;
        }

        $query = DiscountGroupGrant::query()
            ->where('user_id', $userId)
            ->where('group_id', $groupId)
            ->where('item_id', $itemId)
            ->where('discount_code_id', $discountCodeId);

        $renewalId
            ? $query->where('renewal_id', $renewalId)
            : $query->whereNull('renewal_id');

        /** @var DiscountGroupGrant|null $grant */
        $grant = $query->first();
        $hadGroupBeforeGrant = $this->userHasGroup($user, $groupId)
            && !$this->hasUnrevokedGrantForUserGroup($userId, $groupId, $grant ? (int) $grant->id : null);

        if (!$grant) {
            $grant = new DiscountGroupGrant();
            $grant->user_id = $userId;
            $grant->group_id = $groupId;
            $grant->item_id = $itemId;
            $grant->renewal_id = $renewalId;
            $grant->discount_code_id = $discountCodeId;
            $grant->was_member_before = $hadGroupBeforeGrant;
        } elseif ($grant->revoked_at) {
            $grant->was_member_before = $hadGroupBeforeGrant;
        }

        $grant->starts_at = $startsAt;
        $grant->ends_at = $endsAt;
        $grant->revoked_at = null;
        $grant->save();

        $this->attachGroup($user, $groupId);

        return true;
    }

    protected function revokeGrant(DiscountGroupGrant $grant, CarbonInterface $now): bool
    {
        if ($grant->revoked_at) {
            return false;
        }

        $grant->revoked_at = $now;
        $grant->save();

        if ($grant->was_member_before || $this->hasOtherActiveGrant($grant, $now)) {
            return true;
        }

        $user = User::query()->find((int) $grant->user_id);

        if ($user && $this->userHasGroup($user, (int) $grant->group_id)) {
            $this->detachGroup($user, (int) $grant->group_id);
        }

        return true;
    }

    protected function hasOtherActiveGrant(DiscountGroupGrant $grant, CarbonInterface $now): bool
    {
        return $this->hasActiveGrantForUserGroup((int) $grant->user_id, (int) $grant->group_id, (int) $grant->id, $now);
    }

    protected function hasActiveGrantForUserGroup(int $userId, int $groupId, ?int $exceptGrantId = null, ?CarbonInterface $now = null): bool
    {
        $now = $now ?: AdSlotTime::now();
        $query = DiscountGroupGrant::query()
            ->where('user_id', $userId)
            ->where('group_id', $groupId)
            ->whereNull('revoked_at')
            ->where(function ($query) use ($now) {
                $query->whereNull('ends_at')
                    ->orWhere('ends_at', '>', $now);
            });

        if ($exceptGrantId) {
            $query->where('id', '!=', $exceptGrantId);
        }

        return $query->exists();
    }

    protected function hasUnrevokedGrantForUserGroup(int $userId, int $groupId, ?int $exceptGrantId = null): bool
    {
        $query = DiscountGroupGrant::query()
            ->where('user_id', $userId)
            ->where('group_id', $groupId)
            ->whereNull('revoked_at');

        if ($exceptGrantId) {
            $query->where('id', '!=', $exceptGrantId);
        }

        return $query->exists();
    }

    protected function findDiscountCode(?string $codeValue): ?DiscountCode
    {
        $codeValue = trim((string) $codeValue);

        if ($codeValue === '') {
            return null;
        }

        return DiscountCode::query()->where('code', $codeValue)->first();
    }

    protected function findGrantableGroup(int $groupId): ?Group
    {
        if ($groupId <= 0 || in_array($groupId, self::FORBIDDEN_GRANT_GROUP_IDS, true)) {
            return null;
        }

        return Group::query()->find($groupId);
    }

    protected function attachGroup(User $user, int $groupId): void
    {
        if ($this->userHasGroup($user, $groupId)) {
            return;
        }

        $oldGroups = $user->groups()->get()->all();
        $user->groups()->syncWithoutDetaching([$groupId]);
        $user->unsetRelation('groups');
        $this->events->dispatch(new GroupsChanged($user, $oldGroups));
    }

    protected function detachGroup(User $user, int $groupId): void
    {
        $oldGroups = $user->groups()->get()->all();
        $user->groups()->detach($groupId);
        $user->unsetRelation('groups');
        $this->events->dispatch(new GroupsChanged($user, $oldGroups));
    }

    protected function userHasGroup(User $user, int $groupId): bool
    {
        return $user->groups()->where('groups.id', $groupId)->exists();
    }
}
