<?php

namespace Doingfb\AdSlot\Api\Controller;

use Doingfb\AdSlot\Support\AdSlotSettings;
use Laminas\Diactoros\Response\JsonResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

class GetForumConfigController implements RequestHandlerInterface
{
    public function __construct(protected AdSlotSettings $settings)
    {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        return new JsonResponse([
            'data' => [
                'baseMonthlyFee' => $this->settings->getBaseMonthlyFee(),
                'noticeBarEnabled' => $this->settings->getNoticeBarEnabled(),
                'noticeBarText' => $this->settings->getNoticeBarText(),
            ],
        ]);
    }
}
