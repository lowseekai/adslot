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
        protected SettingsRepositoryInterface $settings
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $actor = RequestUtil::getActor($request);
        $actor->assertAdmin();

        $attributes = (array) Arr::get($request->getParsedBody(), 'data.attributes', []);

        $baseMonthlyFee = max(0, round((float) ($attributes['baseMonthlyFee'] ?? 0), 2));
        $defaultDiscountAmount = max(0, round((float) ($attributes['defaultDiscountAmount'] ?? 0), 2));
        $defaultDiscountValidDays = max(1, (int) ($attributes['defaultDiscountValidDays'] ?? 30));
        $discountEnabledGroupIds = array_values(array_unique(array_filter(array_map('intval', (array) ($attributes['discountEnabledGroupIds'] ?? [])), fn ($id) => $id > 0)));

        $this->settings->set(AdSlotSettings::KEY_BASE_MONTHLY_FEE, (string) $baseMonthlyFee);
        $this->settings->set(AdSlotSettings::KEY_DEFAULT_DISCOUNT_AMOUNT, (string) $defaultDiscountAmount);
        $this->settings->set(AdSlotSettings::KEY_DEFAULT_DISCOUNT_VALID_DAYS, (string) $defaultDiscountValidDays);
        $this->settings->set(AdSlotSettings::KEY_DISCOUNT_ENABLED_GROUP_IDS, json_encode($discountEnabledGroupIds, JSON_UNESCAPED_UNICODE));

        return new JsonResponse([
            'data' => [
                'baseMonthlyFee' => $baseMonthlyFee,
                'defaultDiscountAmount' => $defaultDiscountAmount,
                'defaultDiscountValidDays' => $defaultDiscountValidDays,
                'discountEnabledGroupIds' => $discountEnabledGroupIds,
            ],
        ]);
    }
}
