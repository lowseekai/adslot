<?php

namespace Doingfb\AdSlot\Api\Controller;

use Doingfb\AdSlot\Support\AdSlotSettings;
use Flarum\Http\RequestUtil;
use Laminas\Diactoros\Response\JsonResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

class GetAdminConfigController implements RequestHandlerInterface
{
    public function __construct(protected AdSlotSettings $settings)
    {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        RequestUtil::getActor($request)->assertAdmin();
        return new JsonResponse(['data' => [
            'baseMonthlyFee' => $this->settings->getBaseMonthlyFee(),
            'noticeBarEnabled' => $this->settings->getNoticeBarEnabled(),
            'noticeBarText' => $this->settings->getNoticeBarText(),
        ]]);
    }
}
