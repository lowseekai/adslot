<?php

namespace Doingfb\AdSlot\Api\Controller;

use Doingfb\AdSlot\Model\Item;
use Doingfb\AdSlot\Serializer\ItemSerializer;
use Doingfb\AdSlot\Support\AdSlotSettings;
use Doingfb\AdSlot\Support\BusinessNotifier;
use Doingfb\AdSlot\Support\ItemValidator;
use Flarum\Api\Controller\AbstractCreateController;
use Flarum\Foundation\ValidationException;
use Flarum\Http\RequestUtil;
use Illuminate\Support\Arr;
use Psr\Http\Message\ServerRequestInterface;
use Ramon\PointSystem\Repository\PointsRepository;
use Tobscure\JsonApi\Document;

class CreateItemController extends AbstractCreateController
{
    public $serializer = ItemSerializer::class;

    public function __construct(
        protected ItemValidator $validator,
        protected AdSlotSettings $settings,
        protected PointsRepository $points,
        protected BusinessNotifier $notifier
    ) {
    }

    protected function data(ServerRequestInterface $request, Document $document): Item
    {
        $actor = RequestUtil::getActor($request);
        $actor->assertRegistered();
        $input = $this->validator->validateForCreate((array) Arr::get($request->getParsedBody(), 'data.attributes', []));
        $durationMonths = (int) ($input['durationMonths'] ?? 1);
        $fee = round($this->settings->getBaseMonthlyFee() * $durationMonths, 2);
        $pointsAmount = max(0, (int) round($fee));

        $item = new Item();
        $item->user_id = $actor->id;
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

        $item->save();
        $item->sort_order = max(1, (int) $item->id);
        $item->save();
        if ($pointsAmount > 0) {
            try {
                $transaction = $this->points->deduct($actor, $pointsAmount, 'adslot.application', 'adslot_item', $item->id);
                $item->point_transaction_id = $transaction->id;
                $item->save();
            } catch (\DomainException) {
                $item->delete();
                throw new ValidationException(['points' => '????????????????']);
            }
        }
        $this->notifier->notifyPendingReview($item, $actor);

        return $item;
    }
}
