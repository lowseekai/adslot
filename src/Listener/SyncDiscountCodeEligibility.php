<?php

namespace Doingfb\AdSlot\Listener;

use Doingfb\AdSlot\Support\DiscountCodeService;
use Flarum\User\Event\GroupsChanged;

class SyncDiscountCodeEligibility
{
    public function __construct(
        protected DiscountCodeService $discountCodes
    ) {
    }

    public function handle(GroupsChanged $event): void
    {
        $this->discountCodes->syncActorEligibility($event->user);
    }
}
