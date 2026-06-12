<?php

namespace Doingfb\AdSlot\Api\Controller;

use Doingfb\AdSlot\Model\Item;
use Doingfb\AdSlot\Notification\ItemReviewedBlueprint;
use Doingfb\AdSlot\Serializer\ItemSerializer;
use Doingfb\AdSlot\Support\AdSlotTime;
use Doingfb\AdSlot\Support\ImagePathManager;
use Doingfb\AdSlot\Support\ItemValidator;
use Flarum\Api\Controller\AbstractShowController;
use Flarum\Http\RequestUtil;
use Flarum\Notification\NotificationSyncer;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Arr;
use Psr\Http\Message\ServerRequestInterface;
use Tobscure\JsonApi\Document;

class UpdateAdminItemController extends AbstractShowController
{
    public $serializer = ItemSerializer::class;

    public function __construct(
        protected ItemValidator $validator,
        protected ImagePathManager $imagePathManager,
        protected NotificationSyncer $notifications
    ) {
    }

    protected function data(ServerRequestInterface $request, Document $document): Item
    {
        $actor = RequestUtil::getActor($request);
        $actor->assertAdmin();

        $item = $this->resolveItem($request);
        $previousImagePath = $item->image_path;
        $previousStatus = (string) $item->status;
        $previousVisible = (bool) $item->is_visible;
        $previousReviewNote = (string) ($item->review_note ?? '');
        $input = $this->validator->validateForAdminUpdate(
            (array) Arr::get($request->getParsedBody(), 'data.attributes', [])
        );

        if (array_key_exists('merchantName', $input)) {
            $item->merchant_name = $input['merchantName'];
        }

        if (array_key_exists('imagePath', $input)) {
            $item->image_path = $input['imagePath'];
        }

        if (array_key_exists('targetUrl', $input)) {
            $item->target_url = $input['targetUrl'];
        }

        if (array_key_exists('contactType', $input)) {
            $item->contact_type = $input['contactType'];
        }

        if (array_key_exists('contactValue', $input)) {
            $item->contact_value = $input['contactValue'];
            $item->contact = $input['contactValue'];
        }

        if (array_key_exists('discountCode', $input)) {
            $item->discount_code = $input['discountCode'];
        }

        if (array_key_exists('paymentProofPath', $input)) {
            $item->payment_proof_path = $input['paymentProofPath'];
        }

        if (array_key_exists('durationMonths', $input)) {
            $item->duration_months = $input['durationMonths'];
        }

        if (array_key_exists('adFeeAmount', $input)) {
            $item->ad_fee_amount = $input['adFeeAmount'];
        }

        if (array_key_exists('discountAmount', $input)) {
            $item->discount_amount = $input['discountAmount'];
        }

        if (array_key_exists('payableAmount', $input)) {
            $item->payable_amount = $input['payableAmount'];
        }

        if (array_key_exists('status', $input)) {
            $item->status = (string) $input['status'];
        }

        if (array_key_exists('isVisible', $input)) {
            $item->is_visible = (bool) $input['isVisible'];
        }

        if (array_key_exists('isPinned', $input)) {
            $item->is_pinned = (bool) $input['isPinned'];
        }

        if (array_key_exists('sortOrder', $input)) {
            $item->sort_order = (int) $input['sortOrder'];
        }

        if (array_key_exists('startsAt', $input)) {
            $item->starts_at = $input['startsAt'];
        }

        if (array_key_exists('endsAt', $input)) {
            $item->ends_at = $input['endsAt'];
        }

        $becameApproved = $previousStatus !== 'approved' && (string) $item->status === 'approved';
        $durationChanged = array_key_exists('durationMonths', $input);
        $hasManualEndsAt = array_key_exists('endsAt', $input);

        if ($becameApproved) {
            [$startsAt, $endsAt] = AdSlotTime::advertisingWindowForMonths((int) ($item->duration_months ?: 1));
            $item->starts_at = $startsAt;
            $item->ends_at = $endsAt;
        } elseif ((string) $item->status === 'approved' && $durationChanged && !$hasManualEndsAt) {
            $startsAt = $item->starts_at ?: AdSlotTime::displayNow()->setTimezone(AdSlotTime::STORAGE_TIMEZONE);

            if (!$item->starts_at) {
                $item->starts_at = $startsAt;
            }

            $item->ends_at = AdSlotTime::endAfterNaturalMonths($startsAt, (int) ($item->duration_months ?: 1));
        }

        if (array_key_exists('reviewNote', $input)) {
            $item->review_note = $input['reviewNote'];
        }

        $item->reviewed_by = $actor->id;
        $item->save();

        if (array_key_exists('imagePath', $input) && $previousImagePath !== $item->image_path) {
            $this->imagePathManager->deleteIfManagedAndUnused($previousImagePath, $item->id);
        }

        $reviewChanged = $previousStatus !== (string) $item->status
            || $previousVisible !== (bool) $item->is_visible
            || $previousReviewNote !== (string) ($item->review_note ?? '');
        $shouldNotifyReviewResult = $previousStatus !== (string) $item->status
            && in_array((string) $item->status, ['approved', 'rejected'], true);

        if ($reviewChanged && $shouldNotifyReviewResult && $item->user && (int) $item->user->id !== (int) $actor->id) {
            $this->notifications->sync(
                new ItemReviewedBlueprint($item, $actor, [
                    'merchantName' => (string) $item->merchant_name,
                    'status' => (string) $item->status,
                    'isVisible' => (bool) $item->is_visible,
                    'reviewNote' => (string) ($item->review_note ?? ''),
                ]),
                [$item->user]
            );
        }

        return $item;
    }

    protected function resolveItem(ServerRequestInterface $request): Item
    {
        $body = (array) $request->getParsedBody();
        $id = $request->getAttribute('id')
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
