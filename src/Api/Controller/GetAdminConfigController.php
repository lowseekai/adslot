<?php

namespace Doingfb\AdSlot\Api\Controller;

use Doingfb\AdSlot\Support\AdSlotSettings;
use Flarum\Group\Group;
use Flarum\Http\RequestUtil;
use Laminas\Diactoros\Response\JsonResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

class GetAdminConfigController implements RequestHandlerInterface
{
    protected const FORBIDDEN_GRANT_GROUP_IDS = [
        Group::GUEST_ID,
        Group::ADMINISTRATOR_ID,
        Group::MEMBER_ID,
        Group::MODERATOR_ID,
    ];

    public function __construct(
        protected AdSlotSettings $settings
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $actor = RequestUtil::getActor($request);
        $actor->assertAdmin();
        $discountEnabledGroupIds = array_values(array_filter(
            $this->settings->getDiscountEnabledGroupIds(),
            fn ($id) => (int) $id !== Group::GUEST_ID
        ));

        return new JsonResponse([
            'data' => [
                'baseMonthlyFee' => $this->settings->getBaseMonthlyFee(),
                'defaultDiscountAmount' => $this->settings->getDefaultDiscountAmount(),
                'defaultDiscountValidDays' => $this->settings->getDefaultDiscountValidDays(),
                'personalDiscountCodeLimit' => $this->settings->getPersonalDiscountCodeLimit(),
                'discountEnabledGroupIds' => $discountEnabledGroupIds,
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
                'groups' => Group::query()
                    ->where('id', '!=', Group::GUEST_ID)
                    ->orderBy('id')
                    ->get(['id', 'name_singular'])
                    ->map(fn (Group $group) => [
                        'id' => $group->id,
                        'name' => $this->translateGroupName($group),
                    ])->values(),
                'grantableGroups' => Group::query()
                    ->whereNotIn('id', self::FORBIDDEN_GRANT_GROUP_IDS)
                    ->orderBy('id')
                    ->get(['id', 'name_singular'])
                    ->map(fn (Group $group) => [
                        'id' => $group->id,
                        'name' => $this->translateGroupName($group),
                    ])->values(),
            ],
        ]);
    }

    protected function translateGroupName(Group $group): string
    {
        return match ((int) $group->id) {
            Group::ADMINISTRATOR_ID => '管理员',
            Group::MEMBER_ID => '普通注册用户',
            Group::MODERATOR_ID => '版主',
            default => $group->name_singular,
        };
    }
}
