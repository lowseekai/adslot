<?php

namespace Doingfb\AdSlot\Content;

use Flarum\Frontend\Document;
use Psr\Http\Message\ServerRequestInterface;

class MyAdsPage
{
    public function __invoke(Document $document, ServerRequestInterface $request): void
    {
        $document->title = '我的广告';
        $document->content = '<div id="adslot-my-root"></div>';
        $document->payload['adslot'] = [
            'route' => '/providers/my',
            'resource' => 'my-items',
        ];
    }
}
