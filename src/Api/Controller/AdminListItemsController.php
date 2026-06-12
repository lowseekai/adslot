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
    public $limit = 10;
    public $maxLimit = 50;

    public function __construct(
        protected ItemRepository $items
    ) {
    }

    protected function data(ServerRequestInterface $request, Document $document): iterable
    {
        $actor = RequestUtil::getActor($request);
        $actor->assertAdmin();

        $params = $request->getQueryParams();
        $summary = filter_var($params['summary'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $query = $this->items->queryForAdmin(
            $params['status'] ?? null,
            $params['isVisible'] ?? null,
            $params['q'] ?? null
        );
        $total = (clone $query)->count();
        $limit = $summary
            ? min(max((int) ($params['limit'] ?? 10), 1), 10)
            : $this->extractLimit($request);
        $offset = $summary ? 0 : $this->extractOffset($request);
        $hasMore = ($offset + $limit) < $total;

        $document->setMeta([
            'summary' => $summary,
            'total' => $total,
            'limit' => $limit,
            'offset' => $offset,
            'hasMore' => $hasMore,
            'page' => (int) floor($offset / max($limit, 1)) + 1,
            'totalPages' => (int) ceil($total / max($limit, 1)),
        ]);

        return $query
            ->offset($offset)
            ->limit($limit)
            ->get();
    }
}
