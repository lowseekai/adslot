<?php

namespace Doingfb\AdSlot\Api\Controller;

use Doingfb\AdSlot\Model\ItemRenewal;
use Doingfb\AdSlot\Model\Item;
use Doingfb\AdSlot\Serializer\ItemRenewalSerializer;
use Doingfb\AdSlot\Support\AdSlotTime;
use Doingfb\AdSlot\Support\BusinessNotifier;
use Doingfb\AdSlot\Support\DiscountGroupGrantService;
use Doingfb\AdSlot\Support\PointReservationService;
use Flarum\Api\Controller\AbstractShowController;
use Flarum\Foundation\ValidationException;
use Flarum\Http\RequestUtil;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Arr;
use Psr\Http\Message\ServerRequestInterface;
use Tobscure\JsonApi\Document;

class ReviewItemRenewalController extends AbstractShowController
{
    public $serializer = ItemRenewalSerializer::class;

    public function __construct(
        protected BusinessNotifier $notifier,
        protected DiscountGroupGrantService $groupGrants,
        protected PointReservationService $pointReservations
    ) {
    }

    protected function data(ServerRequestInterface $request, Document $document): ItemRenewal
    {
        $actor = RequestUtil::getActor($request);
        $actor->assertAdmin();

        $renewal = $this->resolveRenewal($request);
        $attributes = (array) Arr::get($request->getParsedBody(), 'data.attributes', []);
        $status = (string) ($attributes['status'] ?? '');

        if (!in_array($status, ['approved', 'rejected'], true)) {
            throw new ValidationException(['message' => '续费审核状态无效。']);
        }

        if ((string) $renewal->status !== 'pending') {
            throw new ValidationException(['message' => '该续费申请已经处理过。']);
        }

        $renewal->status = $status;
        $renewal->review_note = ($attributes['reviewNote'] ?? null) !== null ? trim((string) $attributes['reviewNote']) : null;
        $renewal->reviewed_by = $actor->id;
        $renewal->reviewed_at = AdSlotTime::now();

        if ($status === 'rejected') {
            $this->pointReservations->refundRenewal($renewal);
        }

        if ($status === 'approved') {
            $item = $renewal->item;

            if (!$item) {
                throw new ModelNotFoundException();
            }

            $isExpiredRenewal = $this->isExpiredRenewal($item, $renewal->reviewed_at);
            $renewal->old_ends_at = $item->ends_at;
            $renewal->new_ends_at = AdSlotTime::renewalEndAfterNaturalMonths($item->ends_at, (int) ($renewal->duration_months ?: 1), $renewal->reviewed_at);

            if ($isExpiredRenewal) {
                $item->is_pinned = false;
                $item->sort_order = $this->nextSortOrder();
            }

            $item->ends_at = $renewal->new_ends_at;
            if ($renewal->contact_type) {
                $item->contact_type = $renewal->contact_type;
            }
            if ($renewal->contact_value) {
                $item->contact_value = $renewal->contact_value;
                $item->contact = $renewal->contact_value;
            }
            $item->status = 'approved';
            $item->is_visible = true;
            $item->expiry_warning_notified_at = null;
            $item->expired_notified_at = null;
            $item->save();
        }

        $renewal->save();

        if ($status === 'approved') {
            $this->groupGrants->grantForApprovedRenewal($renewal);
        }

        $this->notifier->notifyRenewalReviewed($renewal, $actor);

        return $renewal->load(['item', 'user']);
    }

    protected function isExpiredRenewal(Item $item, $reviewedAt): bool
    {
        if ((string) $item->status === 'expired') {
            return true;
        }

        if (!$item->ends_at) {
            return false;
        }

        return $item->ends_at
            ->copy()
            ->setTimezone(AdSlotTime::STORAGE_TIMEZONE)
            ->lessThanOrEqualTo($reviewedAt->copy()->setTimezone(AdSlotTime::STORAGE_TIMEZONE));
    }

    protected function nextSortOrder(): int
    {
        return max(1, (int) Item::query()->max('sort_order')) + 1;
    }

    protected function resolveRenewal(ServerRequestInterface $request): ItemRenewal
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

        return ItemRenewal::query()->with(['item', 'user'])->has('item')->findOrFail($id);
    }
}
