<?php

namespace Doingfb\AdSlot\Api\Controller;

use Doingfb\AdSlot\Support\AdSlotSettings;
use Flarum\Http\RequestUtil;
use Flarum\Settings\SettingsRepositoryInterface;
use Illuminate\Support\Arr;
use Laminas\Diactoros\Response\JsonResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

class SaveAdminConfigController implements RequestHandlerInterface
{
    public function __construct(
        protected SettingsRepositoryInterface $settings,
        protected AdSlotSettings $adSlotSettings
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $actor = RequestUtil::getActor($request);
        $actor->assertAdmin();

        $attributes = (array) Arr::get($request->getParsedBody(), 'data.attributes', []);

        if (array_key_exists('baseMonthlyFee', $attributes)) {
            $this->settings->set(AdSlotSettings::KEY_BASE_MONTHLY_FEE, (string) max(0, round((float) $attributes['baseMonthlyFee'], 2)));
        }

        if (array_key_exists('defaultDiscountAmount', $attributes)) {
            $this->settings->set(AdSlotSettings::KEY_DEFAULT_DISCOUNT_AMOUNT, (string) max(0, round((float) $attributes['defaultDiscountAmount'], 2)));
        }

        if (array_key_exists('defaultDiscountValidDays', $attributes)) {
            $this->settings->set(AdSlotSettings::KEY_DEFAULT_DISCOUNT_VALID_DAYS, (string) max(1, (int) $attributes['defaultDiscountValidDays']));
        }

        if (array_key_exists('personalDiscountCodeLimit', $attributes)) {
            $this->settings->set(AdSlotSettings::KEY_PERSONAL_DISCOUNT_CODE_LIMIT, (string) max(1, (int) $attributes['personalDiscountCodeLimit']));
        }

        if (array_key_exists('discountEnabledGroupIds', $attributes)) {
            $discountEnabledGroupIds = array_values(array_unique(array_filter(array_map('intval', (array) $attributes['discountEnabledGroupIds']), fn ($id) => $id > 0)));
            $this->settings->set(AdSlotSettings::KEY_DISCOUNT_ENABLED_GROUP_IDS, json_encode($discountEnabledGroupIds, JSON_UNESCAPED_UNICODE));
        }

        if (array_key_exists('noticeBarEnabled', $attributes)) {
            $this->settings->set(AdSlotSettings::KEY_NOTICE_BAR_ENABLED, (bool) $attributes['noticeBarEnabled'] ? '1' : '0');
        }

        if (array_key_exists('noticeBarText', $attributes)) {
            $noticeBarText = $this->validateAndNormalizeString($attributes['noticeBarText'], 'noticeBarText');
            $this->settings->set(AdSlotSettings::KEY_NOTICE_BAR_TEXT, $noticeBarText !== '' ? mb_substr($noticeBarText, 0, 2000) : AdSlotSettings::DEFAULT_NOTICE_BAR_TEXT);
        }

        if (array_key_exists('paymentGuideEnabled', $attributes)) {
            $this->settings->set(AdSlotSettings::KEY_PAYMENT_GUIDE_ENABLED, (bool) $attributes['paymentGuideEnabled'] ? '1' : '0');
        }

        if (array_key_exists('paymentGuideTitle', $attributes)) {
            $this->settings->set(AdSlotSettings::KEY_PAYMENT_GUIDE_TITLE, mb_substr($this->validateAndNormalizeString($attributes['paymentGuideTitle'], 'paymentGuideTitle'), 0, 40));
        }

        if (array_key_exists('paymentGuideText', $attributes)) {
            $this->settings->set(AdSlotSettings::KEY_PAYMENT_GUIDE_TEXT, mb_substr($this->validateAndNormalizeString($attributes['paymentGuideText'], 'paymentGuideText'), 0, 300));
        }

        if (array_key_exists('paymentExtraText', $attributes)) {
            $this->settings->set(AdSlotSettings::KEY_PAYMENT_EXTRA_TEXT, mb_substr($this->validateAndNormalizeString($attributes['paymentExtraText'], 'paymentExtraText'), 0, 300));
        }

        if (array_key_exists('paymentWechatAccount', $attributes)) {
            $this->settings->set(AdSlotSettings::KEY_PAYMENT_WECHAT_ACCOUNT, mb_substr($this->validateAndNormalizeString($attributes['paymentWechatAccount'], 'paymentWechatAccount'), 0, 200));
        }

        if (array_key_exists('paymentWechatQrCodeUrl', $attributes)) {
            $this->settings->set(AdSlotSettings::KEY_PAYMENT_WECHAT_QR_CODE_URL, mb_substr($this->validateAndNormalizeString($attributes['paymentWechatQrCodeUrl'], 'paymentWechatQrCodeUrl'), 0, 500));
        }

        if (array_key_exists('paymentWechatNote', $attributes)) {
            $this->settings->set(AdSlotSettings::KEY_PAYMENT_WECHAT_NOTE, mb_substr($this->validateAndNormalizeString($attributes['paymentWechatNote'], 'paymentWechatNote'), 0, 200));
        }

        if (array_key_exists('paymentAlipayAccount', $attributes)) {
            $this->settings->set(AdSlotSettings::KEY_PAYMENT_ALIPAY_ACCOUNT, mb_substr($this->validateAndNormalizeString($attributes['paymentAlipayAccount'], 'paymentAlipayAccount'), 0, 200));
        }

        if (array_key_exists('paymentAlipayQrCodeUrl', $attributes)) {
            $this->settings->set(AdSlotSettings::KEY_PAYMENT_ALIPAY_QR_CODE_URL, mb_substr($this->validateAndNormalizeString($attributes['paymentAlipayQrCodeUrl'], 'paymentAlipayQrCodeUrl'), 0, 500));
        }

        if (array_key_exists('paymentAlipayNote', $attributes)) {
            $this->settings->set(AdSlotSettings::KEY_PAYMENT_ALIPAY_NOTE, mb_substr($this->validateAndNormalizeString($attributes['paymentAlipayNote'], 'paymentAlipayNote'), 0, 200));
        }

        if (array_key_exists('paymentUsdtAccount', $attributes)) {
            $this->settings->set(AdSlotSettings::KEY_PAYMENT_USDT_ACCOUNT, mb_substr($this->validateAndNormalizeString($attributes['paymentUsdtAccount'], 'paymentUsdtAccount'), 0, 200));
        }

        if (array_key_exists('paymentUsdtQrCodeUrl', $attributes)) {
            $this->settings->set(AdSlotSettings::KEY_PAYMENT_USDT_QR_CODE_URL, mb_substr($this->validateAndNormalizeString($attributes['paymentUsdtQrCodeUrl'], 'paymentUsdtQrCodeUrl'), 0, 500));
        }

        if (array_key_exists('paymentUsdtNote', $attributes)) {
            $this->settings->set(AdSlotSettings::KEY_PAYMENT_USDT_NOTE, mb_substr($this->validateAndNormalizeString($attributes['paymentUsdtNote'], 'paymentUsdtNote'), 0, 200));
        }

        // 使用 AdSlotSettings 辅助类读取最新值，避免重复代码
        return new JsonResponse([
            'data' => [
                'baseMonthlyFee' => $this->adSlotSettings->getBaseMonthlyFee(),
                'defaultDiscountAmount' => $this->adSlotSettings->getDefaultDiscountAmount(),
                'defaultDiscountValidDays' => $this->adSlotSettings->getDefaultDiscountValidDays(),
                'personalDiscountCodeLimit' => $this->adSlotSettings->getPersonalDiscountCodeLimit(),
                'discountEnabledGroupIds' => $this->adSlotSettings->getDiscountEnabledGroupIds(),
                'noticeBarEnabled' => $this->adSlotSettings->getNoticeBarEnabled(),
                'noticeBarText' => $this->adSlotSettings->getNoticeBarText(),
                'paymentGuideEnabled' => $this->adSlotSettings->getPaymentGuideEnabled(),
                'paymentGuideTitle' => $this->adSlotSettings->getPaymentGuideTitle(),
                'paymentGuideText' => $this->adSlotSettings->getPaymentGuideText(),
                'paymentExtraText' => $this->adSlotSettings->getPaymentExtraText(),
                'paymentWechatAccount' => $this->adSlotSettings->getPaymentWechatAccount(),
                'paymentWechatQrCodeUrl' => $this->adSlotSettings->getPaymentWechatQrCodeUrl(),
                'paymentWechatNote' => $this->adSlotSettings->getPaymentWechatNote(),
                'paymentAlipayAccount' => $this->adSlotSettings->getPaymentAlipayAccount(),
                'paymentAlipayQrCodeUrl' => $this->adSlotSettings->getPaymentAlipayQrCodeUrl(),
                'paymentAlipayNote' => $this->adSlotSettings->getPaymentAlipayNote(),
                'paymentUsdtAccount' => $this->adSlotSettings->getPaymentUsdtAccount(),
                'paymentUsdtQrCodeUrl' => $this->adSlotSettings->getPaymentUsdtQrCodeUrl(),
                'paymentUsdtNote' => $this->adSlotSettings->getPaymentUsdtNote(),
            ],
        ]);
    }

    /**
     * 验证并规范化字符串输入，防止类型错误
     */
    protected function validateAndNormalizeString(mixed $value, string $fieldName): string
    {
        if (is_array($value) || is_object($value)) {
            throw new \Flarum\Foundation\ValidationException([
                'message' => sprintf('字段 %s 必须是字符串类型。', $fieldName)
            ]);
        }

        return trim((string) $value);
    }
}
