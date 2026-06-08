<?php

namespace Doingfb\AdSlot\Api\Controller;

use Doingfb\AdSlot\Serializer\ItemSerializer;
use Doingfb\AdSlot\Support\ItemRepository;
use Flarum\Api\Controller\AbstractListController;
use Psr\Http\Message\ServerRequestInterface;
use Tobscure\JsonApi\Document;

class ListPublicItemsController extends AbstractListController
{
    public $serializer = ItemSerializer::class;

    public function __construct(
        protected ItemRepository $items
    ) {
    }

    protected function data(ServerRequestInterface $request, Document $document): iterable
    {
        return $this->items->queryVisible()->get();
    }
}
