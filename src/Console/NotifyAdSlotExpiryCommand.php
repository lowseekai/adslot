<?php

namespace Doingfb\AdSlot\Console;

use Doingfb\AdSlot\Model\Item;
use Doingfb\AdSlot\Support\AdSlotTime;
use Doingfb\AdSlot\Support\BusinessNotifier;
use Doingfb\AdSlot\Support\DiscountGroupGrantService;
use Flarum\Console\AbstractCommand;

class NotifyAdSlotExpiryCommand extends AbstractCommand
{
    public function __construct(
        protected BusinessNotifier $notifier,
        protected DiscountGroupGrantService $groupGrants
    ) {
        parent::__construct();
    }

    protected function configure()
    {
        $this
            ->setName('adslot:notify-expiry')
            ->setDescription('Send ad slot expiry notifications.');
    }

    protected function fire(): int
    {
        $now = AdSlotTime::now();
        $warningDeadline = $now->copy()->addDays(3);
        $expiringCount = 0;
        $expiredCount = 0;
        $revokedGrantCount = 0;

        Item::query()
            ->with('user')
            ->where('status', 'approved')
            ->whereNotNull('ends_at')
            ->whereNull('expiry_warning_notified_at')
            ->where('ends_at', '>', $now)
            ->where('ends_at', '<=', $warningDeadline)
            ->chunkById(100, function ($items) use (&$expiringCount, $now) {
                foreach ($items as $item) {
                    $this->notifier->notifyItemExpiring($item, 3);
                    $item->expiry_warning_notified_at = $now->copy();
                    $item->save();
                    $expiringCount++;
                }
            });

        Item::query()
            ->with('user')
            ->where('status', 'approved')
            ->whereNotNull('ends_at')
            ->where('ends_at', '<=', $now)
            ->chunkById(100, function ($items) use (&$expiredCount, $now) {
                foreach ($items as $item) {
                    if (!$item->expired_notified_at) {
                        $this->notifier->notifyItemExpired($item);
                        $item->expired_notified_at = $now->copy();
                    }

                    $item->status = 'expired';
                    $item->is_visible = false;
                    $item->save();
                    $expiredCount++;
                }
            });

        $revokedGrantCount = $this->groupGrants->revokeExpired($now);

        $this->info("AdSlot expiry notifications sent. expiring={$expiringCount}, expired={$expiredCount}, revokedGroupGrants={$revokedGrantCount}");

        return 0;
    }
}


