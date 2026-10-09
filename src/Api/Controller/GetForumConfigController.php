<?php

namespace DoingfbAdSlotApiController;

use DoingfbAdSlotSupportAdSlotSettings;
use LaminasDiactorosResponseJsonResponse;
use PsrHttpMessageResponseInterface;
use PsrHttpMessageServerRequestInterface;
use PsrHttpServerRequestHandlerInterface;

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
