<?php

namespace Doingfb\AdSlot\Content;

use Flarum\Frontend\Document;
use Psr\Http\Message\ServerRequestInterface;

class ProvidersPage
{
    public function __invoke(Document $document, ServerRequestInterface $request): void
    {
        $document->title = '商家合作';
        $document->content = '<div id="adslot-providers-root"></div>';
        $document->payload['adslot'] = [
            'route' => '/providers',
            'resource' => 'items',
        ];
    }
}
