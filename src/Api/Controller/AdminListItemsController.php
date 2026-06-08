<?php

namespace Doingfb\AdSlot\Api\Controller;

use Doingfb\AdSlot\Serializer\ItemSerializer;
use Doingfb\AdSlot\Support\ItemRepository;
use Flarum\Api\Controller\AbstractListController;
use Flarum\Http\RequestUtil;
use Psr\Http\Message\ServerRequestInterface;
use Tobscure\JsonApi\Document;

class AdminListItemsController extends AbstractListController
{
    public $serializer = ItemSerializer::class;

    public function __construct(
        protected ItemRepository $items
    ) {
    }

    protected function data(ServerRequestInterface $request, Document $document): iterable
    {
        $actor = RequestUtil::getActor($request);
        $actor->assertAdmin();

        $params = $request->getQueryParams();

        return $this->items->queryForAdmin(
            $params['status'] ?? null,
            $params['isVisible'] ?? null,
            $params['q'] ?? null
        )->get();
    }
}
