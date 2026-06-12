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

class PreviewDiscountCodeController implements RequestHandlerInterface
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
        $codeValue = trim((string) ($attributes['code'] ?? ''));
        $durationMonths = (int) ($attributes['durationMonths'] ?? 1);
        $preview = $this->discountCodes->previewSubmission($codeValue, $actor, $durationMonths);

        return new JsonResponse([
            'data' => $this->serializePreview($preview, $codeValue, $durationMonths),
        ]);
    }

    protected function serializePreview(array $preview, string $codeValue, int $durationMonths): array
    {
        /** @var DiscountCode|null $code */
        $code = $preview['discountCode'] ?? null;

        return [
            'code' => $code ? (string) $code->code : $codeValue,
            'amount' => $code ? (float) $code->amount : 0.0,
            'discountAmount' => (float) ($preview['discountAmount'] ?? 0),
            'adFeeAmount' => (float) ($preview['adFeeAmount'] ?? 0),
            'payableAmount' => (float) ($preview['payableAmount'] ?? 0),
            'durationMonths' => $preview['durationMonths'] ?? null,
            'durationLabel' => $preview['durationLabel'] ?? $this->discountCodes->durationRestrictionLabel(null),
            'requestedDurationMonths' => $durationMonths,
            'startsAt' => $code ? AdSlotTime::atom($code->starts_at) : null,
            'expiresAt' => $code ? AdSlotTime::atom($code->expires_at) : null,
            'isApplicable' => (bool) ($preview['isApplicable'] ?? false),
            'message' => (string) ($preview['message'] ?? ''),
        ];
    }
}
