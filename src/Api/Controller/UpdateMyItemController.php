<?php

namespace Doingfb\AdSlot\Api\Controller;

use Doingfb\AdSlot\Model\Item;
use Doingfb\AdSlot\Serializer\ItemSerializer;
use Doingfb\AdSlot\Support\AdSlotSettings;
use Doingfb\AdSlot\Support\BusinessNotifier;
use Doingfb\AdSlot\Support\ImagePathManager;
use Doingfb\AdSlot\Support\ItemValidator;
use Flarum\Api\Controller\AbstractShowController;
use Flarum\Foundation\ValidationException;
use Flarum\Http\RequestUtil;
use Illuminate\Support\Arr;
use Psr\Http\Message\ServerRequestInterface;
use Ramon\PointSystem\Repository\PointsRepository;
use Tobscure\JsonApi\Document;

class UpdateMyItemController extends AbstractShowController
{
    public $serializer = ItemSerializer::class;

    public function __construct(
        protected ItemValidator $validator,
        protected AdSlotSettings $settings,
        protected PointsRepository $points,
        protected ImagePathManager $imagePathManager,
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
        $wasRejected = (string) $item->status === 'rejected';
        $input = $this->validator->validateForUserUpdate((array) Arr::get($request->getParsedBody(), 'data.attributes', []));
        $rawAttributes = (array) Arr::get($request->getParsedBody(), 'data.attributes', []);
        $durationMonths = array_key_exists('durationMonths', $rawAttributes)
            ? (int) $input['durationMonths']
            : (int) ($item->duration_months ?: 1);
        if (!$wasRejected && $durationMonths !== (int) ($item->duration_months ?: 1)) {
            throw new ValidationException(['durationMonths' => '待审核申请不能修改投放时长。']);
        }
        $fee = round($this->settings->getBaseMonthlyFee() * $durationMonths, 2);
        $pointsAmount = max(0, (int) round($fee));

        if ($wasRejected && $pointsAmount > 0) {
            try {
                $transaction = $this->points->deduct($actor, $pointsAmount, 'adslot.application', 'adslot_item', $item->id);
                $item->point_transaction_id = $transaction->id;
                $item->points_refunded_at = null;
            } catch (\DomainException) {
                throw new ValidationException(['points' => '积分余额不足，无法重新提交广告申请。']);
            }
        }

        $item->merchant_name = $input['merchantName'];
        $item->image_path = $input['imagePath'];
        $item->target_url = $input['targetUrl'];
        $item->contact_type = $input['contactType'];
        $item->contact_value = $input['contactValue'];
        $item->contact = $input['contactValue'];
        $item->duration_months = $durationMonths;
        $item->ad_fee_amount = $fee;
        $item->discount_amount = 0;
        $item->payable_amount = $fee;
        $item->status = 'pending';
        $item->is_visible = false;
        $item->review_note = null;
        $item->save();
        $this->notifier->notifyPendingReview($item, $actor);

        if ($previousImagePath !== $item->image_path) {
            $this->imagePathManager->deleteIfManagedAndUnused($previousImagePath, $item->id);
        }

        return $item;
    }

    protected function resolveItem(ServerRequestInterface $request): Item
    {
        $body = (array) $request->getParsedBody();
        $routeParameters = (array) $request->getAttribute('routeParameters', []);
        $id = $request->getAttribute('id') ?? Arr::get($routeParameters, 'id') ?? Arr::get($body, 'data.id') ?? Arr::get($body, 'data.attributes.id') ?? Arr::get($body, 'id');
        return Item::query()->findOrFail((int) $id);
    }
}
