<?php

namespace Doingfb\AdSlot\Support;

use Flarum\Settings\SettingsRepositoryInterface;

class AdSlotSettings
{
    public const KEY_BASE_MONTHLY_FEE = 'doingfb-adslot.baseMonthlyFee';
    public const KEY_DEFAULT_DISCOUNT_AMOUNT = 'doingfb-adslot.defaultDiscountAmount';
    public const KEY_DEFAULT_DISCOUNT_VALID_DAYS = 'doingfb-adslot.defaultDiscountValidDays';
    public const KEY_DISCOUNT_ENABLED_GROUP_IDS = 'doingfb-adslot.discountEnabledGroupIds';
    public const KEY_PERSONAL_DISCOUNT_CODE_LIMIT = 'doingfb-adslot.personalDiscountCodeLimit';
    public const KEY_NOTICE_BAR_ENABLED = 'doingfb-adslot.noticeBarEnabled';
    public const KEY_NOTICE_BAR_TEXT = 'doingfb-adslot.noticeBarText';
    public const KEY_PAYMENT_GUIDE_ENABLED = 'doingfb-adslot.paymentGuideEnabled';
    public const KEY_PAYMENT_GUIDE_TITLE = 'doingfb-adslot.paymentGuideTitle';
    public const KEY_PAYMENT_GUIDE_TEXT = 'doingfb-adslot.paymentGuideText';
    public const KEY_PAYMENT_EXTRA_TEXT = 'doingfb-adslot.paymentExtraText';
    public const KEY_PAYMENT_WECHAT_ACCOUNT = 'doingfb-adslot.paymentWechatAccount';
    public const KEY_PAYMENT_WECHAT_QR_CODE_URL = 'doingfb-adslot.paymentWechatQrCodeUrl';
    public const KEY_PAYMENT_WECHAT_NOTE = 'doingfb-adslot.paymentWechatNote';
    public const KEY_PAYMENT_ALIPAY_ACCOUNT = 'doingfb-adslot.paymentAlipayAccount';
    public const KEY_PAYMENT_ALIPAY_QR_CODE_URL = 'doingfb-adslot.paymentAlipayQrCodeUrl';
    public const KEY_PAYMENT_ALIPAY_NOTE = 'doingfb-adslot.paymentAlipayNote';
    public const KEY_PAYMENT_USDT_ACCOUNT = 'doingfb-adslot.paymentUsdtAccount';
    public const KEY_PAYMENT_USDT_QR_CODE_URL = 'doingfb-adslot.paymentUsdtQrCodeUrl';
    public const KEY_PAYMENT_USDT_NOTE = 'doingfb-adslot.paymentUsdtNote';

    // 默认值常量
    public const DEFAULT_BASE_MONTHLY_FEE = 200.0;
    public const DEFAULT_DISCOUNT_AMOUNT = 100.0;
    public const DEFAULT_DISCOUNT_VALID_DAYS = 30;
    public const DEFAULT_PERSONAL_DISCOUNT_CODE_LIMIT = 1;
    public const DEFAULT_NOTICE_BAR_TEXT = '活动即将到来';
    public const DEFAULT_PAYMENT_GUIDE_TITLE = '支付方式';
    public const DEFAULT_PAYMENT_GUIDE_TEXT = '请先按以下收款信息完成转账，支付成功后再上传支付凭证。';
    public const DEFAULT_PAYMENT_EXTRA_TEXT = '完成付款后，请上传包含金额、时间和收款方信息的转账截图。';
    public const DEFAULT_PAYMENT_WECHAT_NOTE = '支持微信扫码或转账付款。';
    public const DEFAULT_PAYMENT_ALIPAY_NOTE = '支持支付宝扫码或转账付款。';
    public const DEFAULT_PAYMENT_USDT_NOTE = '仅支持 USDT 转账，请确认链类型和地址无误。';

    public function __construct(
        protected SettingsRepositoryInterface $settings
    ) {
    }

    public function getBaseMonthlyFee(): float
    {
        return $this->toMoney($this->settings->get(self::KEY_BASE_MONTHLY_FEE), self::DEFAULT_BASE_MONTHLY_FEE);
    }

    public function getDefaultDiscountAmount(): float
    {
        return $this->toMoney($this->settings->get(self::KEY_DEFAULT_DISCOUNT_AMOUNT), self::DEFAULT_DISCOUNT_AMOUNT);
    }

    public function getDefaultDiscountValidDays(): int
    {
        $value = (int) ($this->settings->get(self::KEY_DEFAULT_DISCOUNT_VALID_DAYS) ?? self::DEFAULT_DISCOUNT_VALID_DAYS);

        return $value > 0 ? $value : self::DEFAULT_DISCOUNT_VALID_DAYS;
    }

    /**
     * @return int[]
     */
    public function getDiscountEnabledGroupIds(): array
    {
        $raw = $this->settings->get(self::KEY_DISCOUNT_ENABLED_GROUP_IDS);

        if (is_array($raw)) {
            $values = $raw;
        } else {
            $decoded = json_decode((string) $raw, true);
            $values = is_array($decoded) ? $decoded : [];
        }

        return array_values(array_unique(array_filter(array_map('intval', $values), fn ($id) => $id > 0)));
    }

    public function getPersonalDiscountCodeLimit(): int
    {
        $value = (int) ($this->settings->get(self::KEY_PERSONAL_DISCOUNT_CODE_LIMIT) ?? self::DEFAULT_PERSONAL_DISCOUNT_CODE_LIMIT);

        return $value > 0 ? $value : self::DEFAULT_PERSONAL_DISCOUNT_CODE_LIMIT;
    }

    public function getNoticeBarEnabled(): bool
    {
        $value = $this->settings->get(self::KEY_NOTICE_BAR_ENABLED);

        if ($value === null || $value === '') {
            return true;
        }

        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }

    public function getNoticeBarText(): string
    {
        return $this->trimText(self::KEY_NOTICE_BAR_TEXT, self::DEFAULT_NOTICE_BAR_TEXT, 200);
    }

    public function getPaymentGuideEnabled(): bool
    {
        $value = $this->settings->get(self::KEY_PAYMENT_GUIDE_ENABLED);

        if ($value === null || $value === '') {
            return true;
        }

        return filter_var($value, FILTER_VALIDATE_BOOLEAN);
    }

    public function getPaymentGuideTitle(): string
    {
        return $this->trimText(self::KEY_PAYMENT_GUIDE_TITLE, self::DEFAULT_PAYMENT_GUIDE_TITLE, 40);
    }

    public function getPaymentGuideText(): string
    {
        return $this->trimText(self::KEY_PAYMENT_GUIDE_TEXT, self::DEFAULT_PAYMENT_GUIDE_TEXT, 300);
    }

    public function getPaymentWechatAccount(): string
    {
        return $this->trimText(self::KEY_PAYMENT_WECHAT_ACCOUNT, '', 200);
    }

    public function getPaymentWechatQrCodeUrl(): string
    {
        return $this->trimText(self::KEY_PAYMENT_WECHAT_QR_CODE_URL, '', 500);
    }

    public function getPaymentWechatNote(): string
    {
        return $this->trimText(self::KEY_PAYMENT_WECHAT_NOTE, self::DEFAULT_PAYMENT_WECHAT_NOTE, 200);
    }

    public function getPaymentAlipayAccount(): string
    {
        return $this->trimText(self::KEY_PAYMENT_ALIPAY_ACCOUNT, '', 200);
    }

    public function getPaymentAlipayQrCodeUrl(): string
    {
        return $this->trimText(self::KEY_PAYMENT_ALIPAY_QR_CODE_URL, '', 500);
    }

    public function getPaymentAlipayNote(): string
    {
        return $this->trimText(self::KEY_PAYMENT_ALIPAY_NOTE, self::DEFAULT_PAYMENT_ALIPAY_NOTE, 200);
    }

    public function getPaymentUsdtAccount(): string
    {
        return $this->trimText(self::KEY_PAYMENT_USDT_ACCOUNT, '', 200);
    }

    public function getPaymentUsdtQrCodeUrl(): string
    {
        return $this->trimText(self::KEY_PAYMENT_USDT_QR_CODE_URL, '', 500);
    }

    public function getPaymentUsdtNote(): string
    {
        return $this->trimText(self::KEY_PAYMENT_USDT_NOTE, self::DEFAULT_PAYMENT_USDT_NOTE, 200);
    }

    public function getPaymentExtraText(): string
    {
        return $this->trimText(self::KEY_PAYMENT_EXTRA_TEXT, self::DEFAULT_PAYMENT_EXTRA_TEXT, 300);
    }

    protected function toMoney(mixed $value, float $default): float
    {
        if (!is_numeric($value)) {
            return $default;
        }

        return max(0, round((float) $value, 2));
    }

    protected function trimText(string $key, string $default, int $limit): string
    {
        $value = trim((string) ($this->settings->get($key) ?? ''));

        if ($value === '') {
            return $default;
        }

        return mb_substr($value, 0, $limit);
    }
}
