<?php

namespace Doingfb\AdSlot\Policy;

use Doingfb\AdSlot\Model\Item;
use Flarum\User\User;

class AdSlotPolicy
{
    public function edit(User $actor, Item $item): bool
    {
        return $actor->id === $item->user_id && in_array($item->status, ['pending', 'rejected'], true);
    }

    public function review(User $actor): bool
    {
        return $actor->isAdmin();
    }
}
