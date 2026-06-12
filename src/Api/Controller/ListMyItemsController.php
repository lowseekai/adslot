<?php

namespace Doingfb\AdSlot\Api\Controller;

use Doingfb\AdSlot\Serializer\ItemSerializer;
use Doingfb\AdSlot\Support\ItemRepository;
use Flarum\Api\Controller\AbstractListController;
use Flarum\Http\RequestUtil;
use Psr\Http\Message\ServerRequestInterface;
use Tobscure\JsonApi\Document;

class ListMyItemsController extends AbstractListController
{
    public $serializer = ItemSerializer::class;

    public function __construct(
        protected ItemRepository $items
    ) {
    }

    protected function data(ServerRequestInterface $request, Document $document): iterable
    {
        $actor = RequestUtil::getActor($request);
        $actor->assertRegistered();

        return $this->items
            ->queryForUser($actor)
            ->with('pendingRenewals')
            ->where('adslot_items.user_id', (int) $actor->id)
            ->get()
            ->filter(fn ($item) => (int) $item->user_id === (int) $actor->id)
            ->values();
    }
}
