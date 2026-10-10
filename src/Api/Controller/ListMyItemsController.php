<?php

namespace Doingfb\AdSlot\Api\Controller;

use Doingfb\AdSlot\Serializer\ItemSerializer;
use Doingfb\AdSlot\Support\ItemRepository;
use Flarum\Http\RequestUtil;
use Laminas\Diactoros\Response\JsonResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

class ListMyItemsController implements RequestHandlerInterface
{
    public function __construct(protected ItemRepository $items) {}

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $actor = RequestUtil::getActor($request);
        $actor->assertRegistered();
        $serializer = new ItemSerializer();
        $data = $this->items->queryForUser($actor)->with('pendingRenewals')->where('adslot_items.user_id', (int) $actor->id)->get()
            ->filter(fn ($item) => (int) $item->user_id === (int) $actor->id)
            ->map(fn ($item) => ['type' => 'adslot-items', 'id' => (string) $item->id, 'attributes' => $serializer->attributes($item)])->values();
        return new JsonResponse(['data' => $data]);
    }
}
