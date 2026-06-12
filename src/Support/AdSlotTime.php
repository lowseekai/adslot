<?php

namespace Doingfb\AdSlot\Support;

use Carbon\Carbon;
use Carbon\CarbonInterface;

class AdSlotTime
{
    public const DISPLAY_TIMEZONE = 'Asia/Shanghai';
    public const STORAGE_TIMEZONE = 'UTC';

    public static function displayNow(): Carbon
    {
        return Carbon::now(self::DISPLAY_TIMEZONE);
    }

    public static function now(): Carbon
    {
        return Carbon::now(self::STORAGE_TIMEZONE);
    }

    public static function displayEndOfDayAfterDays(int $days): Carbon
    {
        return self::displayNow()
            ->addDays(max(1, $days))
            ->endOfDay()
            ->setTimezone(self::STORAGE_TIMEZONE);
    }

    public static function advertisingWindowForMonths(int $months): array
    {
        $startsAt = self::displayNow();

        return [
            $startsAt->copy()->setTimezone(self::STORAGE_TIMEZONE),
            self::endAfterNaturalMonths($startsAt, $months),
        ];
    }

    public static function endAfterNaturalMonths(CarbonInterface $startsAt, int $months): Carbon
    {
        return $startsAt->copy()
            ->setTimezone(self::DISPLAY_TIMEZONE)
            ->addMonthsNoOverflow(max(1, $months))
            ->setTimezone(self::STORAGE_TIMEZONE);
    }

    public static function renewalEndAfterNaturalMonths(?CarbonInterface $currentEndsAt, int $months, ?CarbonInterface $reviewedAt = null): Carbon
    {
        $base = ($reviewedAt ?: self::now())->copy()->setTimezone(self::STORAGE_TIMEZONE);

        if ($currentEndsAt && $currentEndsAt->copy()->setTimezone(self::STORAGE_TIMEZONE)->greaterThan($base)) {
            $base = $currentEndsAt->copy()->setTimezone(self::STORAGE_TIMEZONE);
        }

        return self::endAfterNaturalMonths($base, $months);
    }

    public static function parse(mixed $value): ?Carbon
    {
        if ($value === null || $value === '') {
            return null;
        }

        return Carbon::parse((string) $value, self::DISPLAY_TIMEZONE)
            ->setTimezone(self::STORAGE_TIMEZONE);
    }

    public static function atom(?CarbonInterface $value): ?string
    {
        if (!$value) {
            return null;
        }

        return $value->copy()->setTimezone(self::DISPLAY_TIMEZONE)->toAtomString();
    }

    public static function displayDiffInDays(?CarbonInterface $startsAt, ?CarbonInterface $expiresAt, int $fallback = 1): int
    {
        if (!$startsAt || !$expiresAt) {
            return max(1, $fallback);
        }

        $startDay = $startsAt->copy()->setTimezone(self::DISPLAY_TIMEZONE)->startOfDay();
        $endDay = $expiresAt->copy()->setTimezone(self::DISPLAY_TIMEZONE)->startOfDay();

        return max(1, $startDay->diffInDays($endDay));
    }
}
