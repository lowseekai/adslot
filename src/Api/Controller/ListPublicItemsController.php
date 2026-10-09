<?php

namespace Doingfb\AdSlot\Api\Controller;

use Doingfb\AdSlot\Support\ItemRepository;
use Laminas\Diactoros\Response\JsonResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

class ListPublicItemsController implements RequestHandlerInterface
{
    public function __construct(
        protected ItemRepository $items
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $items = $this->items->queryVisible()->get()->map(function ($item) {
            return [
                'type' => 'adslot-items',
                'id' => (string) $item->id,
                'attributes' => [
                    'merchantName' => $item->merchant_name,
                    'imagePath' => $item->image_path,
                    'targetUrl' => $item->target_url,
                    'status' => $item->status,
                    'isPinned' => (bool) $item->is_pinned,
                    'isVisible' => (bool) $item->is_visible,
                    'startsAt' => $item->starts_at?->toAtomString(),
                    'endsAt' => $item->ends_at?->toAtomString(),
                ],
            ];
        })->values()->all();

        return new JsonResponse(['data' => $items]);
    }
}
