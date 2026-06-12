<?php

namespace Doingfb\AdSlot\Api\Controller;

use Doingfb\AdSlot\Model\Item;
use Doingfb\AdSlot\Serializer\ItemSerializer;
use Doingfb\AdSlot\Support\BusinessNotifier;
use Doingfb\AdSlot\Support\DiscountCodeService;
use Doingfb\AdSlot\Support\ImagePathManager;
use Doingfb\AdSlot\Support\ItemValidator;
use Flarum\Api\Controller\AbstractShowController;
use Flarum\Foundation\ValidationException;
use Flarum\Http\RequestUtil;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Arr;
use Psr\Http\Message\ServerRequestInterface;
use Tobscure\JsonApi\Document;

class UpdateMyItemController extends AbstractShowController
{
    public $serializer = ItemSerializer::class;

    public function __construct(
        protected ItemValidator $validator,
        protected ImagePathManager $imagePathManager,
        protected DiscountCodeService $discountCodes,
        protected BusinessNotifier $notifier
    ) {
    }

    protected function data(ServerRequestInterface $request, Document $document): Item
    {
        $actor = RequestUtil::getActor($request);
        $actor->assertRegistered();

        $item = $this->resolveItem($request);

        if ((int) $item->user_id !== (int) $actor->id || !in_array($item->status, ['pending', 'rejected'], true)) {
            throw new \Flarum\User\Exception\PermissionDeniedException();
        }

        $previousImagePath = $item->image_path;
        $input = $this->validator->validateForUserUpdate(
            (array) Arr::get($request->getParsedBody(), 'data.attributes', [])
        );
        // 使用 DiscountCodeService 的规范化逻辑确保比较一致性
        $normalizedInputCode = trim((string) ($input['discountCode'] ?? ''));
        $normalizedItemCode = trim((string) $item->discount_code);
        $isSameDiscountCode = $normalizedInputCode === $normalizedItemCode;
        $pricing = $this->discountCodes->resolveSubmission($input['discountCode'] ?? null, $actor, $input['durationMonths'] ?? 1, $item);

        // 使用统一的支付凭证验证方法
        $this->validator->validatePaymentProof($pricing, $input['paymentProofPath'] ?? null);

        $item->merchant_name = $input['merchantName'];
        $item->image_path = $input['imagePath'];
        $item->target_url = $input['targetUrl'];
        $item->contact_type = $input['contactType'];
        $item->contact_value = $input['contactValue'];
        $item->contact = $input['contactValue'];
        $item->discount_code = $input['discountCode'];
        $item->payment_proof_path = $input['paymentProofPath'] ?? null;
        $item->duration_months = $input['durationMonths'] ?? 1;
        $item->ad_fee_amount = $pricing['adFeeAmount'];
        $item->discount_amount = $pricing['discountAmount'];
        $item->payable_amount = $pricing['payableAmount'];
        $item->status = 'pending';
        $item->is_visible = false;
        $item->review_note = null;
        $item->save();

        $shouldNotifyDiscountUsed = $pricing['discountCode'] && !$isSameDiscountCode;

        $this->discountCodes->bindToItem($pricing['discountCode'], $item, $isSameDiscountCode);
        $this->notifier->notifyPendingReview($item, $actor);

        if ($shouldNotifyDiscountUsed) {
            $this->notifier->notifyDiscountCodeUsed($item, $pricing['discountCode'], $actor);
        }

        if ($previousImagePath !== $item->image_path) {
            $this->imagePathManager->deleteIfManagedAndUnused($previousImagePath, $item->id);
        }

        return $item;
    }

    protected function resolveItem(ServerRequestInterface $request): Item
    {
        $body = (array) $request->getParsedBody();
        $routeParameters = (array) $request->getAttribute('routeParameters', []);
        $id = $request->getAttribute('id')
            ?? Arr::get($routeParameters, 'id')
            ?? Arr::get($body, 'data.id')
            ?? Arr::get($body, 'data.attributes.id')
            ?? Arr::get($body, 'id');

        $id = (int) $id;

        if ($id <= 0) {
            throw new ModelNotFoundException();
        }

        return Item::query()->findOrFail($id);
    }
}
