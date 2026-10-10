<?php

namespace Doingfb\AdSlot\Api\Controller;

use Doingfb\AdSlot\Model\Item;
use Doingfb\AdSlot\Model\ItemRenewal;
use Doingfb\AdSlot\Serializer\ItemRenewalSerializer;
use Doingfb\AdSlot\Support\AdSlotSettings;
use Doingfb\AdSlot\Support\BusinessNotifier;
use Doingfb\AdSlot\Support\ItemValidator;
use Flarum\Api\Controller\AbstractCreateController;
use Flarum\Foundation\ValidationException;
use Flarum\Http\RequestUtil;
use Flarum\User\Exception\PermissionDeniedException;
use Illuminate\Support\Arr;
use Psr\Http\Message\ServerRequestInterface;
use Ramon\PointSystem\Repository\PointsRepository;
use Tobscure\JsonApi\Document;

class CreateItemRenewalController extends AbstractCreateController
{
    public $serializer = ItemRenewalSerializer::class;

    public function __construct(
        protected AdSlotSettings $settings,
        protected PointsRepository $points,
        protected BusinessNotifier $notifier
    ) {}

    protected function data(ServerRequestInterface $request, Document $document): ItemRenewal
    {
        $actor = RequestUtil::getActor($request);
        $actor->assertRegistered();
        $item = $this->resolveItem($request);
        if ((int) $item->user_id !== (int) $actor->id) throw new PermissionDeniedException();
        if (!in_array((string) $item->status, ['approved', 'expired'], true)) throw new ValidationException(['message' => '只有已通过或已到期的广告可以续费。']);
        if ($item->renewals()->where('status', 'pending')->exists()) throw new ValidationException(['message' => '该广告已有待审核续费申请。']);

        $attributes = (array) Arr::get($request->getParsedBody(), 'data.attributes', []);
        $durationMonths = (int) ($attributes['durationMonths'] ?? 1);
        $contactType = trim((string) ($attributes['contactType'] ?? $item->contact_type ?? ''));
        $contactValue = trim((string) ($attributes['contactValue'] ?? $item->contact_value ?? $item->contact ?? ''));
        if (!in_array($durationMonths, ItemValidator::ALLOWED_DURATION_MONTHS, true)) throw new ValidationException(['message' => '续费时长无效。']);
        if ($contactType === '' || $contactValue === '') throw new ValidationException(['message' => '联系方式不能为空。']);

        $fee = round($this->settings->getBaseMonthlyFee() * $durationMonths, 2);
        $pointsAmount = max(0, (int) round($fee));
        $renewal = new ItemRenewal();
        $renewal->item_id = $item->id;
        $renewal->user_id = $actor->id;
        $renewal->duration_months = $durationMonths;
        $renewal->contact_type = $contactType;
        $renewal->contact_value = $contactValue;
        $renewal->ad_fee_amount = $fee;
        $renewal->discount_amount = 0;
        $renewal->payable_amount = $fee;
        $renewal->status = 'pending';
        $renewal->old_ends_at = $item->ends_at;
        $renewal->save();
        if ($pointsAmount > 0) {
            try {
                $tx = $this->points->deduct($actor, $pointsAmount, 'adslot.renewal', 'adslot_renewal', $renewal->id);
                $renewal->point_transaction_id = $tx->id;
                $renewal->save();
            } catch (\DomainException) {
                $renewal->delete();
                throw new ValidationException(['points' => '积分余额不足，无法提交续费申请。']);
            }
        }
        $this->notifier->notifyRenewalPendingReview($renewal, $actor);
        return $renewal->load(['item', 'user']);
    }

    protected function resolveItem(ServerRequestInterface $request): Item
    {
        $body = (array) $request->getParsedBody();
        $route = (array) $request->getAttribute('routeParameters', []);
        $id = $request->getAttribute('id') ?? Arr::get($route, 'id') ?? Arr::get($body, 'data.id');
        return Item::query()->findOrFail((int) $id);
    }
}
