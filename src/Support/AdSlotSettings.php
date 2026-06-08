<?php

namespace Doingfb\AdSlot\Support;

use Flarum\Settings\SettingsRepositoryInterface;

class AdSlotSettings
{
    public const KEY_BASE_MONTHLY_FEE = 'doingfb-adslot.baseMonthlyFee';
    public const KEY_DEFAULT_DISCOUNT_AMOUNT = 'doingfb-adslot.defaultDiscountAmount';
    public const KEY_DEFAULT_DISCOUNT_VALID_DAYS = 'doingfb-adslot.defaultDiscountValidDays';
    public const KEY_DISCOUNT_ENABLED_GROUP_IDS = 'doingfb-adslot.discountEnabledGroupIds';

    public function __construct(
        protected SettingsRepositoryInterface $settings
    ) {
    }

    public function getBaseMonthlyFee(): float
    {
        return $this->toMoney($this->settings->get(self::KEY_BASE_MONTHLY_FEE), 200);
    }

    public function getDefaultDiscountAmount(): float
    {
        return $this->toMoney($this->settings->get(self::KEY_DEFAULT_DISCOUNT_AMOUNT), 100);
    }

    public function getDefaultDiscountValidDays(): int
    {
        $value = (int) ($this->settings->get(self::KEY_DEFAULT_DISCOUNT_VALID_DAYS) ?? 30);

        return $value > 0 ? $value : 30;
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

    protected function toMoney(mixed $value, float $default): float
    {
        if (!is_numeric($value)) {
            return $default;
        }

        return max(0, round((float) $value, 2));
    }
}
