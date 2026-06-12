<?php

namespace Doingfb\AdSlot\Api\Controller;

use Doingfb\AdSlot\Model\Item;
use Doingfb\AdSlot\Model\ItemRenewal;
use Doingfb\AdSlot\Serializer\ItemRenewalSerializer;
use Doingfb\AdSlot\Support\BusinessNotifier;
use Doingfb\AdSlot\Support\DiscountCodeService;
use Doingfb\AdSlot\Support\ItemValidator;
use Flarum\Api\Controller\AbstractCreateController;
use Flarum\Foundation\ValidationException;
use Flarum\Http\RequestUtil;
use Flarum\User\Exception\PermissionDeniedException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Arr;
use Psr\Http\Message\ServerRequestInterface;
use Tobscure\JsonApi\Document;

class CreateItemRenewalController extends AbstractCreateController
{
    public $serializer = ItemRenewalSerializer::class;

    public function __construct(
        protected DiscountCodeService $discountCodes,
        protected BusinessNotifier $notifier
    ) {
    }

    protected function data(ServerRequestInterface $request, Document $document): ItemRenewal
    {
        $actor = RequestUtil::getActor($request);
        $actor->assertRegistered();

        $item = $this->resolveItem($request);

        if ((int) $item->user_id !== (int) $actor->id) {
            throw new PermissionDeniedException();
        }

        if (!in_array((string) $item->status, ['approved', 'expired'], true)) {
            throw new ValidationException(['message' => '只有已通过或已到期的广告可以提交续费。']);
        }

        if ($item->renewals()->where('status', 'pending')->exists()) {
            throw new ValidationException(['message' => '该广告已有待审核续费申请，请等待管理员处理。']);
        }

        $attributes = (array) Arr::get($request->getParsedBody(), 'data.attributes', []);
        $durationMonths = (int) ($attributes['durationMonths'] ?? 1);
        $contactType = trim((string) ($attributes['contactType'] ?? $item->contact_type ?? ''));
        $contactValue = trim((string) ($attributes['contactValue'] ?? $item->contact_value ?? $item->contact ?? ''));

        if (!in_array($durationMonths, ItemValidator::ALLOWED_DURATION_MONTHS, true)) {
            throw new ValidationException(['message' => '续费时长无效。']);
        }

        $this->assertContact($contactType, $contactValue);

        $paymentProofPath = trim((string) ($attributes['paymentProofPath'] ?? ''));
        $discountCodeValue = ($attributes['discountCode'] ?? null) !== null ? trim((string) $attributes['discountCode']) : '';
        $pricing = $this->discountCodes->resolveSubmission($discountCodeValue ?: null, $actor, $durationMonths);

        if ($pricing['payableAmount'] > 0 && $paymentProofPath === '') {
            throw new ValidationException(['message' => '请上传支付凭证后再提交续费审核。']);
        }

        $renewal = new ItemRenewal();
        $renewal->item_id = $item->id;
        $renewal->user_id = $actor->id;
        $renewal->duration_months = $durationMonths;
        $renewal->contact_type = $contactType;
        $renewal->contact_value = $contactValue;
        $renewal->discount_code = $discountCodeValue ?: null;
        $renewal->payment_proof_path = $paymentProofPath ?: null;
        $renewal->ad_fee_amount = $pricing['adFeeAmount'];
        $renewal->discount_amount = $pricing['discountAmount'];
        $renewal->payable_amount = $pricing['payableAmount'];
        $renewal->status = 'pending';
        $renewal->old_ends_at = $item->ends_at;
        $renewal->save();

        $this->discountCodes->bindToRenewal($pricing['discountCode'], $renewal);
        $this->notifier->notifyRenewalPendingReview($renewal, $actor);

        return $renewal->load(['item', 'user']);
    }

    protected function assertContact(string $type, string $value): void
    {
        if ($type === '') {
            throw new ValidationException(['message' => '联系方式类型不能为空。']);
        }

        if ($value === '') {
            throw new ValidationException(['message' => '联系方式账号不能为空。']);
        }

        if (!in_array($type, ItemValidator::ALLOWED_CONTACT_TYPES, true)) {
            throw new ValidationException(['message' => '联系方式类型无效。']);
        }

        if ($type === 'email' && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
            throw new ValidationException(['message' => '邮箱格式不正确。']);
        }

        if ($type === 'telegram' && !preg_match('/^@?[A-Za-z0-9_]{5,}$/', $value)) {
            throw new ValidationException(['message' => 'Telegram 账号格式不正确。']);
        }
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
