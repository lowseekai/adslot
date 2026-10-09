<?php

namespace Doingfb\AdSlot\Serializer;

use Doingfb\AdSlot\Model\Item;
use Doingfb\AdSlot\Support\AdSlotTime;
use Flarum\Api\Serializer\AbstractSerializer;

class ItemSerializer extends AbstractSerializer
{
    protected $type = 'adslot-items';

    /**
     * @param Item $item
     */
    protected function getDefaultAttributes($item): array
    {
        $pendingRenewal = $this->pendingRenewal($item);

        return [
            'merchantName' => $item->merchant_name,
            'imagePath' => $item->image_path,
            'targetUrl' => $item->target_url,
            'contactType' => $item->contact_type,
            'contactValue' => $item->contact_value ?: $item->contact,
            'contact' => $item->contact_value ?: $item->contact,
            'discountCode' => $item->discount_code,
            'paymentProofPath' => $item->payment_proof_path,
            'durationMonths' => (int) ($item->duration_months ?: 1),
            'adFeeAmount' => (float) $item->ad_fee_amount,
            'discountAmount' => (float) $item->discount_amount,
            'payableAmount' => (float) $item->payable_amount,
            'pointsCharged' => $item->point_transaction_id !== null && $item->points_refunded_at === null,
            'status' => $item->status,
            'isPinned' => (bool) $item->is_pinned,
            'isVisible' => $item->is_visible,
            'sortOrder' => $item->sort_order,
            'startsAt' => AdSlotTime::atom($item->starts_at),
            'endsAt' => AdSlotTime::atom($item->ends_at),
            'reviewNote' => $item->review_note,
            'hasPendingRenewal' => $pendingRenewal !== null,
            'pendingRenewal' => $pendingRenewal ? [
                'id' => (int) $pendingRenewal->id,
                'status' => (string) $pendingRenewal->status,
                'durationMonths' => (int) ($pendingRenewal->duration_months ?: 1),
                'payableAmount' => (float) $pendingRenewal->payable_amount,
                'createdAt' => AdSlotTime::atom($pendingRenewal->created_at),
                'oldEndsAt' => AdSlotTime::atom($pendingRenewal->old_ends_at),
                'newEndsAt' => AdSlotTime::atom($pendingRenewal->new_ends_at),
            ] : null,
            'createdAt' => AdSlotTime::atom($item->created_at),
            'updatedAt' => AdSlotTime::atom($item->updated_at),
        ];
    }

    protected function pendingRenewal(Item $item)
    {
        if ($item->relationLoaded('pendingRenewals')) {
            return $item->pendingRenewals->first();
        }

        return null;
    }
}
