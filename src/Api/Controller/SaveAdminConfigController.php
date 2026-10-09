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
        RequestUtil::getActor($request)->assertAdmin();
        $attributes = (array) Arr::get($request->getParsedBody(), 'data.attributes', []);

        if (array_key_exists('baseMonthlyFee', $attributes)) {
            $this->settings->set(AdSlotSettings::KEY_BASE_MONTHLY_FEE, (string) max(0, (int) round((float) $attributes['baseMonthlyFee'])));
        }
        if (array_key_exists('noticeBarEnabled', $attributes)) {
            $this->settings->set(AdSlotSettings::KEY_NOTICE_BAR_ENABLED, !empty($attributes['noticeBarEnabled']) ? '1' : '0');
        }
        if (array_key_exists('noticeBarText', $attributes)) {
            $text = is_scalar($attributes['noticeBarText']) ? trim((string) $attributes['noticeBarText']) : '';
            $this->settings->set(AdSlotSettings::KEY_NOTICE_BAR_TEXT, $text !== '' ? mb_substr($text, 0, 2000) : AdSlotSettings::DEFAULT_NOTICE_BAR_TEXT);
        }

        return new JsonResponse(['data' => [
            'baseMonthlyFee' => $this->adSlotSettings->getBaseMonthlyFee(),
            'noticeBarEnabled' => $this->adSlotSettings->getNoticeBarEnabled(),
            'noticeBarText' => $this->adSlotSettings->getNoticeBarText(),
        ]]);
    }
}
