<?php

namespace Doingfb\AdSlot\Content;

use Flarum\Frontend\Document;
use Psr\Http\Message\ServerRequestInterface;

class ApplyPage
{
    public function __invoke(Document $document, ServerRequestInterface $request): void
    {
        $document->title = '商家合作申请';
        $document->content = '<div id="adslot-apply-root"></div>';
        $document->payload['adslot'] = [
            'route' => '/providers/apply',
            'resource' => 'items',
        ];
    }
}
