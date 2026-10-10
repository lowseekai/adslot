<?php

namespace Doingfb\AdSlot\Serializer;

use Doingfb\AdSlot\Model\ItemRenewal;
use Doingfb\AdSlot\Support\AdSlotTime;

class ItemRenewalSerializer
{
    protected $type = 'adslot-item-renewals';

    public function attributes($renewal): array
    {
        return $this->getDefaultAttributes($renewal);
    }

    /**
     * @param ItemRenewal $renewal
     */
    protected function getDefaultAttributes($renewal): array
    {
        $item = $renewal->item;
        $user = $renewal->user;

        return [
            'itemId' => (int) $renewal->item_id,
            'userId' => (int) $renewal->user_id,
            'username' => $user?->username,
            'durationMonths' => (int) ($renewal->duration_months ?: 1),
            'contactType' => $renewal->contact_type,
            'contactValue' => $renewal->contact_value,
            'discountCode' => $renewal->discount_code,
            'paymentProofPath' => $renewal->payment_proof_path,
            'adFeeAmount' => (float) $renewal->ad_fee_amount,
            'discountAmount' => (float) $renewal->discount_amount,
            'payableAmount' => (float) $renewal->payable_amount,
            'status' => $renewal->status,
            'oldEndsAt' => AdSlotTime::atom($renewal->old_ends_at),
            'newEndsAt' => AdSlotTime::atom($renewal->new_ends_at),
            'reviewNote' => $renewal->review_note,
            'reviewedBy' => $renewal->reviewed_by ? (int) $renewal->reviewed_by : null,
            'reviewedAt' => AdSlotTime::atom($renewal->reviewed_at),
            'createdAt' => AdSlotTime::atom($renewal->created_at),
            'updatedAt' => AdSlotTime::atom($renewal->updated_at),
            'item' => $item ? [
                'id' => (int) $item->id,
                'merchantName' => $item->merchant_name,
                'imagePath' => $item->image_path,
                'targetUrl' => $item->target_url,
                'status' => $item->status,
                'isVisible' => (bool) $item->is_visible,
                'sortOrder' => (int) $item->sort_order,
                'startsAt' => AdSlotTime::atom($item->starts_at),
                'endsAt' => AdSlotTime::atom($item->ends_at),
            ] : null,
        ];
    }
}
