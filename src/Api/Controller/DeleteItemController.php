<?php

namespace Doingfb\AdSlot\Api\Controller;

use Doingfb\AdSlot\Model\Item;
use Doingfb\AdSlot\Model\ItemRenewal;
use Doingfb\AdSlot\Support\ImagePathManager;
use Flarum\Http\RequestUtil;
use Illuminate\Support\Arr;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Laminas\Diactoros\Response\EmptyResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

class DeleteItemController implements RequestHandlerInterface
{
    public function __construct(
        protected ImagePathManager $imagePathManager
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $actor = RequestUtil::getActor($request);
        $actor->assertAdmin();

        $item = $this->resolveItem($request);
        $this->imagePathManager->deleteIfManagedAndUnused($item->image_path, $item->id);
        ItemRenewal::query()->where('item_id', $item->id)->delete();
        $item->delete();

        return new EmptyResponse(204);
    }

    protected function resolveItem(ServerRequestInterface $request): Item
    {
        $body = (array) $request->getParsedBody();
        $id = $request->getAttribute('id')
            ?? Arr::get($body, 'data.id')
            ?? Arr::get($body, 'data.attributes.id')
            ?? Arr::get($body, 'id');

        $id = (int) $id;

        if ($id <= 0) {
            throw new ModelNotFoundException();
        }

        return Item::query()->findOrFail($id);
    }
}
