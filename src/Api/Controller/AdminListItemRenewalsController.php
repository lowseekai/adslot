<?php

namespace Doingfb\AdSlot\Api\Controller;

use Doingfb\AdSlot\Model\ItemRenewal;
use Doingfb\AdSlot\Serializer\ItemRenewalSerializer;
use Flarum\Api\Controller\AbstractListController;
use Flarum\Http\RequestUtil;
use Psr\Http\Message\ServerRequestInterface;
use Tobscure\JsonApi\Document;

class AdminListItemRenewalsController extends AbstractListController
{
    public $serializer = ItemRenewalSerializer::class;
    public $limit = 10;
    public $maxLimit = 50;

    protected function data(ServerRequestInterface $request, Document $document): iterable
    {
        $actor = RequestUtil::getActor($request);
        $actor->assertAdmin();

        $params = $request->getQueryParams();
        $status = (string) ($params['status'] ?? '');
        $keyword = trim((string) ($params['q'] ?? ''));

        ItemRenewal::query()->doesntHave('item')->delete();

        $query = ItemRenewal::query()
            ->with(['item', 'user'])
            ->has('item')
            ->orderByDesc('created_at');

        if ($status !== '') {
            $query->where('status', $status);
        }

        if ($keyword !== '') {
            $query->whereHas('item', fn ($itemQuery) => $itemQuery->where('merchant_name', 'like', '%'.$keyword.'%'));
        }

        $total = (clone $query)->count();
        $limit = $this->extractLimit($request);
        $offset = $this->extractOffset($request);

        $document->setMeta([
            'total' => $total,
            'limit' => $limit,
            'offset' => $offset,
            'hasMore' => ($offset + $limit) < $total,
            'page' => (int) floor($offset / max($limit, 1)) + 1,
            'totalPages' => (int) ceil($total / max($limit, 1)),
        ]);

        return $query
            ->offset($offset)
            ->limit($limit)
            ->get();
    }
}
