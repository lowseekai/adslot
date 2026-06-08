<?php

namespace Doingfb\AdSlot\Api\Controller;

use Doingfb\AdSlot\Support\ImagePathManager;
use Flarum\Http\RequestUtil;
use Illuminate\Support\Arr;
use Laminas\Diactoros\Response\EmptyResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

class DeleteUploadedImageController implements RequestHandlerInterface
{
    public function __construct(
        protected ImagePathManager $imagePathManager
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $actor = RequestUtil::getActor($request);
        $actor->assertRegistered();

        $path = Arr::get((array) $request->getParsedBody(), 'path');
        $this->imagePathManager->deleteIfManaged(is_string($path) ? $path : null);

        return new EmptyResponse(204);
    }
}
