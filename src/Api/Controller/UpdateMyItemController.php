<?php

namespace Doingfb\AdSlot\Api\Controller;

use Doingfb\AdSlot\Model\Item;
use Doingfb\AdSlot\Serializer\ItemSerializer;
use Doingfb\AdSlot\Support\DiscountCodeService;
use Doingfb\AdSlot\Support\ImagePathManager;
use Doingfb\AdSlot\Support\ItemValidator;
use Flarum\Api\Controller\AbstractShowController;
use Flarum\Foundation\ValidationException;
use Flarum\Http\RequestUtil;
use Illuminate\Support\Arr;
use Psr\Http\Message\ServerRequestInterface;
use Tobscure\JsonApi\Document;

class UpdateMyItemController extends AbstractShowController
{
    public $serializer = ItemSerializer::class;

    public function __construct(
        protected ItemValidator $validator,
        protected ImagePathManager $imagePathManager,
        protected DiscountCodeService $discountCodes
    ) {
    }

    protected function data(ServerRequestInterface $request, Document $document): Item
    {
        $actor = RequestUtil::getActor($request);
        $actor->assertRegistered();

        $item = Item::query()->findOrFail((int) $request->getAttribute('id'));

        if ((int) $item->user_id !== (int) $actor->id || !in_array($item->status, ['pending', 'rejected'], true)) {
            throw new \Flarum\User\Exception\PermissionDeniedException();
        }

        $previousImagePath = $item->image_path;
        $input = $this->validator->validateForUserUpdate(
            (array) Arr::get($request->getParsedBody(), 'data.attributes', [])
        );
        $pricing = $this->discountCodes->resolveSubmission($input['discountCode'] ?? null, $actor, $item);

        if ($pricing['payableAmount'] > 0 && empty($input['paymentProofPath'])) {
            throw new ValidationException(['message' => '请上传支付凭证后再提交审核。']);
        }

        $item->merchant_name = $input['merchantName'];
        $item->image_path = $input['imagePath'];
        $item->target_url = $input['targetUrl'];
        $item->contact_type = $input['contactType'];
        $item->contact_value = $input['contactValue'];
        $item->contact = $input['contactValue'];
        $item->discount_code = $input['discountCode'];
        $item->payment_proof_path = $input['paymentProofPath'] ?? null;
        $item->ad_fee_amount = $pricing['adFeeAmount'];
        $item->discount_amount = $pricing['discountAmount'];
        $item->payable_amount = $pricing['payableAmount'];
        $item->status = 'pending';
        $item->is_visible = false;
        $item->review_note = null;
        $item->save();

        $this->discountCodes->bindToItem($pricing['discountCode'], $item);

        if ($previousImagePath !== $item->image_path) {
            $this->imagePathManager->deleteIfManaged($previousImagePath);
        }

        return $item;
    }
}
