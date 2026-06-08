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
    public function __construct(
        protected AdSlotSettings $settings
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $actor = RequestUtil::getActor($request);
        $actor->assertAdmin();

        return new JsonResponse([
            'data' => [
                'baseMonthlyFee' => $this->settings->getBaseMonthlyFee(),
                'defaultDiscountAmount' => $this->settings->getDefaultDiscountAmount(),
                'defaultDiscountValidDays' => $this->settings->getDefaultDiscountValidDays(),
                'discountEnabledGroupIds' => $this->settings->getDiscountEnabledGroupIds(),
                'groups' => Group::query()
                    ->orderBy('id')
                    ->get(['id', 'name_singular'])
                    ->map(fn (Group $group) => [
                        'id' => $group->id,
                        'name' => $group->name_singular,
                    ])->values(),
            ],
        ]);
    }
}
