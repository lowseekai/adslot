<?php

namespace Doingfb\AdSlot\Api\Controller;

use Doingfb\AdSlot\Serializer\ItemSerializer;
use Doingfb\AdSlot\Support\ItemRepository;
use Flarum\Http\RequestUtil;
use Laminas\Diactoros\Response\JsonResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

class AdminListItemsController implements RequestHandlerInterface
{
    public function __construct(protected ItemRepository $items) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        RequestUtil::getActor($request)->assertAdmin();
        $params = $request->getQueryParams();
        $summary = filter_var($params['summary'] ?? false, FILTER_VALIDATE_BOOLEAN);
        $query = $this->items->queryForAdmin($params['status'] ?? null, $params['isVisible'] ?? null, $params['q'] ?? null);
        $total = (clone $query)->count();
        $page = is_array($params['page'] ?? null) ? $params['page'] : [];
        $limit = $summary ? min(max((int) ($params['limit'] ?? 10), 1), 10) : min(max((int) ($page['limit'] ?? $params['limit'] ?? 10), 1), 50);
        $offset = $summary ? 0 : max((int) ($page['offset'] ?? $params['offset'] ?? 0), 0);
        $serializer = new ItemSerializer();
        $data = $query->offset($offset)->limit($limit)->get()->map(fn ($item) => ['type' => 'adslot-items', 'id' => (string) $item->id, 'attributes' => $serializer->attributes($item)])->values();
        return new JsonResponse(['data' => $data, 'meta' => [
            'summary' => $summary, 'total' => $total, 'limit' => $limit, 'offset' => $offset,
            'hasMore' => ($offset + $limit) < $total,
            'page' => (int) floor($offset / max($limit, 1)) + 1,
            'totalPages' => (int) ceil($total / max($limit, 1)),
        ]]);
    }
}
