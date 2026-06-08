<?php

namespace Doingfb\AdSlot\Api\Controller;

use Doingfb\AdSlot\Model\Item;
use Doingfb\AdSlot\Serializer\ItemSerializer;
use Doingfb\AdSlot\Support\DiscountCodeService;
use Doingfb\AdSlot\Support\ItemValidator;
use Flarum\Api\Controller\AbstractCreateController;
use Flarum\Foundation\ValidationException;
use Flarum\Http\RequestUtil;
use Illuminate\Support\Arr;
use Psr\Http\Message\ServerRequestInterface;
use Tobscure\JsonApi\Document;

class CreateItemController extends AbstractCreateController
{
    public $serializer = ItemSerializer::class;

    public function __construct(
        protected ItemValidator $validator,
        protected DiscountCodeService $discountCodes
    ) {
    }

    protected function data(ServerRequestInterface $request, Document $document): Item
    {
        $actor = RequestUtil::getActor($request);
        $actor->assertRegistered();

        $input = $this->validator->validateForCreate(
            (array) Arr::get($request->getParsedBody(), 'data.attributes', [])
        );
        $pricing = $this->discountCodes->resolveSubmission($input['discountCode'] ?? null, $actor);

        if ($pricing['payableAmount'] > 0 && empty($input['paymentProofPath'])) {
            throw new ValidationException(['message' => '请上传支付凭证后再提交审核。']);
        }

        $item = new Item();
        $item->user_id = $actor->id;
        $item->merchant_name = $input['merchantName'];
        $item->image_path = $input['imagePath'];
        $item->target_url = $input['targetUrl'];
        $item->contact_type = $input['contactType'];
        $item->contact_value = $input['contactValue'];
        $item->contact = $input['contactValue'];
        $item->discount_code = $input['discountCode'] ?? null;
        $item->payment_proof_path = $input['paymentProofPath'] ?? null;
        $item->ad_fee_amount = $pricing['adFeeAmount'];
        $item->discount_amount = $pricing['discountAmount'];
        $item->payable_amount = $pricing['payableAmount'];
        $item->status = 'pending';
        $item->is_visible = false;
        $item->save();

        $this->discountCodes->bindToItem($pricing['discountCode'], $item);

        return $item;
    }
}
