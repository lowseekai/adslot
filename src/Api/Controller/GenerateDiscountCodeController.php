<?php

namespace Doingfb\AdSlot\Api\Controller;

use Doingfb\AdSlot\Model\DiscountCode;
use Doingfb\AdSlot\Support\AdSlotTime;
use Doingfb\AdSlot\Support\DiscountCodeService;
use Flarum\Http\RequestUtil;
use Illuminate\Support\Arr;
use Laminas\Diactoros\Response\JsonResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

class GenerateDiscountCodeController implements RequestHandlerInterface
{
    public function __construct(
        protected DiscountCodeService $discountCodes
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $actor = RequestUtil::getActor($request);
        $actor->assertRegistered();

        $attributes = (array) Arr::get($request->getParsedBody(), 'data.attributes', []);

        if ($actor->isAdmin() && !empty($attributes)) {
            $quantity = isset($attributes['quantity']) ? (int) $attributes['quantity'] : 1;
            $usageLimit = isset($attributes['usageLimit']) ? (int) $attributes['usageLimit'] : 1;
            $durationMonths = isset($attributes['durationMonths']) ? (int) $attributes['durationMonths'] : null;
            $codes = $this->discountCodes->generateBatchForAdmin(
                $actor,
                isset($attributes['amount']) ? (float) $attributes['amount'] : null,
                isset($attributes['validDays']) ? (int) $attributes['validDays'] : null,
                $quantity,
                $usageLimit,
                $durationMonths
            );

            return new JsonResponse([
                'data' => count($codes) === 1
                    ? $this->serializeCode($codes[0])
                    : array_map(fn (DiscountCode $code) => $this->serializeCode($code), $codes),
            ]);
        }

        $code = $this->discountCodes->generateForActor($actor);

        return new JsonResponse([
            'data' => $this->serializeCode($code),
        ]);
    }

    protected function serializeCode(DiscountCode $code): array
    {
        return [
            'id' => $code->id,
            'code' => $code->code,
            'amount' => (float) $code->amount,
            'startsAt' => AdSlotTime::atom($code->starts_at),
            'expiresAt' => AdSlotTime::atom($code->expires_at),
            'isUsed' => (bool) $code->is_used,
            'usageLimit' => max(1, (int) ($code->usage_limit ?? 1)),
            'usedCount' => max(0, (int) ($code->used_count ?? 0)),
            'durationMonths' => $code->duration_months ? (int) $code->duration_months : null,
            'durationLabel' => $this->discountCodes->durationRestrictionLabel($code->duration_months ? (int) $code->duration_months : null),
            'allowedGroupIds' => $code->allowed_group_ids ?? [],
        ];
    }
}
