<?php

namespace Doingfb\AdSlot\Serializer;

use Doingfb\AdSlot\Model\Item;
use Flarum\Api\Serializer\AbstractSerializer;

class ItemSerializer extends AbstractSerializer
{
    protected $type = 'adslot-items';

    /**
     * @param Item $item
     */
    protected function getDefaultAttributes($item): array
    {
        return [
            'merchantName' => $item->merchant_name,
            'imagePath' => $item->image_path,
            'targetUrl' => $item->target_url,
            'contactType' => $item->contact_type,
            'contactValue' => $item->contact_value ?: $item->contact,
            'contact' => $item->contact_value ?: $item->contact,
            'discountCode' => $item->discount_code,
            'paymentProofPath' => $item->payment_proof_path,
            'adFeeAmount' => (float) $item->ad_fee_amount,
            'discountAmount' => (float) $item->discount_amount,
            'payableAmount' => (float) $item->payable_amount,
            'status' => $item->status,
            'isVisible' => $item->is_visible,
            'sortOrder' => $item->sort_order,
            'startsAt' => optional($item->starts_at)->toAtomString(),
            'endsAt' => optional($item->ends_at)->toAtomString(),
            'reviewNote' => $item->review_note,
            'createdAt' => optional($item->created_at)->toAtomString(),
            'updatedAt' => optional($item->updated_at)->toAtomString(),
        ];
    }
}
