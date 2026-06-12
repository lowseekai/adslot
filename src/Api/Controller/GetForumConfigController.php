<?php

namespace Doingfb\AdSlot\Api\Controller;

use Doingfb\AdSlot\Support\AdSlotSettings;
use Doingfb\AdSlot\Support\DiscountCodeService;
use Flarum\Http\RequestUtil;
use Laminas\Diactoros\Response\JsonResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

class GetForumConfigController implements RequestHandlerInterface
{
    public function __construct(
        protected AdSlotSettings $settings,
        protected DiscountCodeService $discountCodes
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $actor = RequestUtil::getActor($request);

        return new JsonResponse([
            'data' => [
                'canGenerateDiscountCode' => !$actor->isGuest() ? $this->discountCodes->canActorGenerate($actor) : false,
                'baseMonthlyFee' => $this->settings->getBaseMonthlyFee(),
                'defaultDiscountAmount' => $this->settings->getDefaultDiscountAmount(),
                'defaultDiscountValidDays' => $this->settings->getDefaultDiscountValidDays(),
                'noticeBarEnabled' => $this->settings->getNoticeBarEnabled(),
                'noticeBarText' => $this->settings->getNoticeBarText(),
                'paymentGuideEnabled' => $this->settings->getPaymentGuideEnabled(),
                'paymentGuideTitle' => $this->settings->getPaymentGuideTitle(),
                'paymentGuideText' => $this->settings->getPaymentGuideText(),
                'paymentExtraText' => $this->settings->getPaymentExtraText(),
                'paymentWechatAccount' => $this->settings->getPaymentWechatAccount(),
                'paymentWechatQrCodeUrl' => $this->settings->getPaymentWechatQrCodeUrl(),
                'paymentWechatNote' => $this->settings->getPaymentWechatNote(),
                'paymentAlipayAccount' => $this->settings->getPaymentAlipayAccount(),
                'paymentAlipayQrCodeUrl' => $this->settings->getPaymentAlipayQrCodeUrl(),
                'paymentAlipayNote' => $this->settings->getPaymentAlipayNote(),
                'paymentUsdtAccount' => $this->settings->getPaymentUsdtAccount(),
                'paymentUsdtQrCodeUrl' => $this->settings->getPaymentUsdtQrCodeUrl(),
                'paymentUsdtNote' => $this->settings->getPaymentUsdtNote(),
            ],
        ]);
    }
}
