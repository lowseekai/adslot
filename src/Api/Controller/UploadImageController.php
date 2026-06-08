<?php

namespace Doingfb\AdSlot\Api\Controller;

use Doingfb\AdSlot\Support\ImageUploader;
use Flarum\Http\RequestUtil;
use Illuminate\Support\Arr;
use Laminas\Diactoros\Response\JsonResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

class UploadImageController implements RequestHandlerInterface
{
    public function __construct(
        protected ImageUploader $uploader
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $actor = RequestUtil::getActor($request);
        $actor->assertRegistered();

        $kind = Arr::get($request->getParsedBody() ?? [], 'kind', 'ad-image');
        $file = Arr::get($request->getUploadedFiles(), 'image');
        $result = $kind === 'payment-proof'
            ? $this->uploader->uploadPaymentProof($file)
            : $this->uploader->uploadAdImage($file);

        return new JsonResponse([
            'data' => [
                'path' => $result['path'],
                'url' => $result['url'],
                'kind' => $kind,
                'width' => $result['width'],
                'height' => $result['height'],
            ],
        ]);
    }
}
