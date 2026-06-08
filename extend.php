<?php

namespace Doingfb\AdSlot;

use Doingfb\AdSlot\Api\Controller\AdminListItemsController;
use Doingfb\AdSlot\Api\Controller\CreateItemController;
use Doingfb\AdSlot\Api\Controller\DeleteItemController;
use Doingfb\AdSlot\Api\Controller\DeleteUploadedImageController;
use Doingfb\AdSlot\Api\Controller\GenerateDiscountCodeController;
use Doingfb\AdSlot\Api\Controller\GetAdminConfigController;
use Doingfb\AdSlot\Api\Controller\ListMyItemsController;
use Doingfb\AdSlot\Api\Controller\ListPublicItemsController;
use Doingfb\AdSlot\Api\Controller\SaveAdminConfigController;
use Doingfb\AdSlot\Api\Controller\UploadImageController;
use Doingfb\AdSlot\Api\Controller\UpdateAdminItemController;
use Doingfb\AdSlot\Api\Controller\UpdateMyItemController;
use Doingfb\AdSlot\Content\ApplyPage;
use Doingfb\AdSlot\Content\ProvidersPage;
use Doingfb\AdSlot\Support\AdSlotSettings;
use Doingfb\AdSlot\Support\DiscountCodeService;
use Flarum\Api\Serializer\ForumSerializer;
use Flarum\Extend;

return [
    (new Extend\Frontend('admin'))
        ->js(__DIR__.'/js/dist/admin.js')
        ->css(__DIR__.'/less/admin.less'),

    (new Extend\Frontend('forum'))
        ->js(__DIR__.'/js/dist/forum.js')
        ->css(__DIR__.'/less/forum.less')
        ->route('/providers', 'adslot.providers', ProvidersPage::class)
        ->route('/providers/apply', 'adslot.apply', ApplyPage::class),

    (new Extend\Routes('api'))
        ->get('/adslot/public/items', 'adslot.public.items', ListPublicItemsController::class)
        ->get('/adslot/me/items', 'adslot.me.items', ListMyItemsController::class)
        ->post('/adslot/discount-codes/generate', 'adslot.discount-codes.generate', GenerateDiscountCodeController::class)
        ->post('/adslot/upload-image', 'adslot.items.upload-image', UploadImageController::class)
        ->delete('/adslot/upload-image', 'adslot.items.delete-upload-image', DeleteUploadedImageController::class)
        ->post('/adslot/items', 'adslot.items.create', CreateItemController::class)
        ->patch('/adslot/items/{id}', 'adslot.items.update', UpdateMyItemController::class)
        ->post('/adslot/items/{id}/update', 'adslot.items.update.post', UpdateMyItemController::class)
        ->post('/adslot/items/update', 'adslot.items.update.body', UpdateMyItemController::class)
        ->get('/adslot/admin/items', 'adslot.admin.items', AdminListItemsController::class)
        ->get('/adslot/admin/config', 'adslot.admin.config', GetAdminConfigController::class)
        ->post('/adslot/admin/config', 'adslot.admin.config.save', SaveAdminConfigController::class)
        ->patch('/adslot/admin/items/{id}', 'adslot.admin.items.update', UpdateAdminItemController::class)
        ->post('/adslot/admin/items/{id}/update', 'adslot.admin.items.update.post', UpdateAdminItemController::class)
        ->post('/adslot/admin/items/update', 'adslot.admin.items.update.body', UpdateAdminItemController::class)
        ->delete('/adslot/admin/items/{id}', 'adslot.admin.items.delete', DeleteItemController::class)
        ->post('/adslot/admin/items/{id}/delete', 'adslot.admin.items.delete.post', DeleteItemController::class)
        ->post('/adslot/admin/items/delete', 'adslot.admin.items.delete.body', DeleteItemController::class),

    (new Extend\ApiSerializer(ForumSerializer::class))
        ->attributes(function (ForumSerializer $serializer) {
            $actor = $serializer->getActor();
            $settings = resolve(AdSlotSettings::class);
            $discountCodes = resolve(DiscountCodeService::class);

            return [
                'doingfb-adslot.canGenerateDiscountCode' => !$actor->isGuest() ? $discountCodes->canActorGenerate($actor) : false,
                'doingfb-adslot.baseMonthlyFee' => $settings->getBaseMonthlyFee(),
                'doingfb-adslot.defaultDiscountAmount' => $settings->getDefaultDiscountAmount(),
                'doingfb-adslot.defaultDiscountValidDays' => $settings->getDefaultDiscountValidDays(),
            ];
        }),
];
