<?php

namespace Doingfb\AdSlot\Api\Controller;

use Doingfb\AdSlot\Model\ItemRenewal;
use Doingfb\AdSlot\Serializer\ItemRenewalSerializer;
use Flarum\Http\RequestUtil;
use Laminas\Diactoros\Response\JsonResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

class AdminListItemRenewalsController implements RequestHandlerInterface
{
    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        RequestUtil::getActor($request)->assertAdmin();
        $params = $request->getQueryParams();
        $status = (string) ($params['status'] ?? '');
        $keyword = trim((string) ($params['q'] ?? ''));
        ItemRenewal::query()->doesntHave('item')->delete();
        $query = ItemRenewal::query()->with(['item', 'user'])->has('item')->orderByDesc('created_at');
        if ($status !== '') $query->where('status', $status);
        if ($keyword !== '') $query->whereHas('item', fn ($q) => $q->where('merchant_name', 'like', '%'.$keyword.'%'));
        $total = (clone $query)->count();
        $page = is_array($params['page'] ?? null) ? $params['page'] : [];
        $limit = min(max((int) ($page['limit'] ?? $params['limit'] ?? 10), 1), 50);
        $offset = max((int) ($page['offset'] ?? $params['offset'] ?? 0), 0);
        $serializer = new ItemRenewalSerializer();
        $data = $query->offset($offset)->limit($limit)->get()->map(fn ($renewal) => ['type' => 'adslot-item-renewals', 'id' => (string) $renewal->id, 'attributes' => $serializer->attributes($renewal)])->values();
        return new JsonResponse(['data' => $data, 'meta' => [
            'total' => $total, 'limit' => $limit, 'offset' => $offset,
            'hasMore' => ($offset + $limit) < $total,
            'page' => (int) floor($offset / max($limit, 1)) + 1,
            'totalPages' => (int) ceil($total / max($limit, 1)),
        ]]);
    }
}
