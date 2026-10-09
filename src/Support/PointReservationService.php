<?php

namespace Doingfb\AdSlot\Support;

use Doingfb\AdSlot\Model\Item;
use Doingfb\AdSlot\Model\ItemRenewal;
use Illuminate\Database\ConnectionInterface;
use Ramon\PointSystem\Model\PointTransaction;
use Ramon\PointSystem\Model\UserPoints;

class PointReservationService
{
    public function __construct(protected ConnectionInterface $db)
    {
    }

    public function refund(Item $item): void
    {
        $amount = max(0, (int) round((float) $item->payable_amount));

        if ($amount <= 0 || $item->points_refunded_at || !$item->point_transaction_id) {
            return;
        }

        $this->db->transaction(function () use ($item, $amount) {
            $locked = Item::query()->lockForUpdate()->find($item->id);

            if (!$locked || $locked->points_refunded_at || !$locked->point_transaction_id) {
                return;
            }

            $points = UserPoints::query()->where('user_id', $locked->user_id)->lockForUpdate()->first();

            if (!$points) {
                return;
            }

            $points->balance += $amount;
            $points->save();
            PointTransaction::create([
                'user_id' => $locked->user_id,
                'amount' => $amount,
                'reason' => 'adslot.application.refund',
                'reference_type' => 'adslot_item',
                'reference_id' => $locked->id,
            ]);
            $locked->points_refunded_at = AdSlotTime::now();
            $locked->save();
        });
    }

    public function refundRenewal(ItemRenewal $renewal): void
    {
        $amount = max(0, (int) round((float) $renewal->payable_amount));
        if ($amount <= 0 || $renewal->points_refunded_at || !$renewal->point_transaction_id) return;
        $this->db->transaction(function () use ($renewal, $amount) {
            $locked = ItemRenewal::query()->lockForUpdate()->find($renewal->id);
            if (!$locked || $locked->points_refunded_at || !$locked->point_transaction_id) return;
            $points = UserPoints::query()->where('user_id', $locked->user_id)->lockForUpdate()->first();
            if (!$points) return;
            $points->balance += $amount;
            $points->save();
            PointTransaction::create(['user_id' => $locked->user_id, 'amount' => $amount, 'reason' => 'adslot.renewal.refund', 'reference_type' => 'adslot_renewal', 'reference_id' => $locked->id]);
            $locked->points_refunded_at = AdSlotTime::now();
            $locked->save();
        });
    }
}
