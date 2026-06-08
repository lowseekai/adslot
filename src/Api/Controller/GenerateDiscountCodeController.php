<?php

namespace Doingfb\AdSlot\Api\Controller;

use Doingfb\AdSlot\Model\DiscountCode;
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

        $code = $actor->isAdmin() && !empty($attributes)
            ? $this->discountCodes->generateForAdmin(
                $actor,
                isset($attributes['amount']) ? (float) $attributes['amount'] : null,
                isset($attributes['validDays']) ? (int) $attributes['validDays'] : null,
                isset($attributes['allowedGroupIds']) && is_array($attributes['allowedGroupIds']) ? $attributes['allowedGroupIds'] : null
            )
            : $this->discountCodes->generateForActor($actor);

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
            'startsAt' => optional($code->starts_at)->toAtomString(),
            'expiresAt' => optional($code->expires_at)->toAtomString(),
            'isUsed' => (bool) $code->is_used,
            'allowedGroupIds' => $code->allowed_group_ids ?? [],
        ];
    }
}
