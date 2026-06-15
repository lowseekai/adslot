<?php

namespace Doingfb\AdSlot\Api\Controller;

use Doingfb\AdSlot\Model\DiscountCode;
use Doingfb\AdSlot\Support\DiscountGroupGrantService;
use Flarum\Http\RequestUtil;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Support\Arr;
use Laminas\Diactoros\Response\EmptyResponse;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;

class DeleteDiscountCodeController implements RequestHandlerInterface
{
    public function __construct(
        protected DiscountGroupGrantService $groupGrants
    ) {
    }

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $actor = RequestUtil::getActor($request);
        $actor->assertAdmin();

        $discountCode = $this->resolveDiscountCode($request);
        $this->groupGrants->revokeActiveForDiscountCode($discountCode);
        $discountCode->delete();

        return new EmptyResponse(204);
    }

    protected function resolveDiscountCode(ServerRequestInterface $request): DiscountCode
    {
        $body = (array) $request->getParsedBody();
        $query = $request->getQueryParams();
        $id = $request->getAttribute('id')
            ?? Arr::get($query, 'id')
            ?? Arr::get($body, 'data.id')
            ?? Arr::get($body, 'data.attributes.id')
            ?? Arr::get($body, 'id');

        $id = (int) $id;

        if ($id <= 0) {
            throw new ModelNotFoundException();
        }

        return DiscountCode::query()->findOrFail($id);
    }
}
