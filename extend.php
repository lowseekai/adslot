<?php

namespace Doingfb\AdSlot;

use Doingfb\AdSlot\Api\Controller\AdminListItemsController;
use Doingfb\AdSlot\Api\Controller\AdminListItemRenewalsController;
use Doingfb\AdSlot\Api\Controller\AdminListDiscountCodesController;
use Doingfb\AdSlot\Api\Controller\ActivateDiscountCodeController;
use Doingfb\AdSlot\Api\Controller\CreateItemController;
use Doingfb\AdSlot\Api\Controller\CreateItemRenewalController;
use Doingfb\AdSlot\Api\Controller\DeactivateDiscountCodeController;
use Doingfb\AdSlot\Api\Controller\DeleteDiscountCodeController;
use Doingfb\AdSlot\Api\Controller\DeleteItemController;
use Doingfb\AdSlot\Api\Controller\DeleteUploadedImageController;
use Doingfb\AdSlot\Api\Controller\GenerateDiscountCodeController;
use Doingfb\AdSlot\Api\Controller\GetAdminConfigController;
use Doingfb\AdSlot\Api\Controller\GetForumConfigController;
use Doingfb\AdSlot\Api\Controller\ListMyItemsController;
use Doingfb\AdSlot\Api\Controller\ListPublicItemsController;
use Doingfb\AdSlot\Api\Controller\PreviewDiscountCodeController;
use Doingfb\AdSlot\Api\Controller\SaveAdminConfigController;
use Doingfb\AdSlot\Api\Controller\ReviewItemRenewalController;
use Doingfb\AdSlot\Api\Controller\UploadImageController;
use Doingfb\AdSlot\Api\Controller\UpdateAdminItemController;
use Doingfb\AdSlot\Api\Controller\UpdateMyItemController;
use Doingfb\AdSlot\Console\NotifyAdSlotExpiryCommand;
use Doingfb\AdSlot\Content\ApplyPage;
use Doingfb\AdSlot\Content\MyAdsPage;
use Doingfb\AdSlot\Content\ProvidersPage;
use Doingfb\AdSlot\Listener\SyncDiscountCodeEligibility;
use Doingfb\AdSlot\Notification\DiscountCodeUsedBlueprint;
use Doingfb\AdSlot\Notification\ItemExpiredBlueprint;
use Doingfb\AdSlot\Notification\ItemExpiringBlueprint;
use Doingfb\AdSlot\Notification\ItemPendingReviewBlueprint;
use Doingfb\AdSlot\Notification\ItemRenewalPendingReviewBlueprint;
use Doingfb\AdSlot\Notification\ItemRenewalReviewedBlueprint;
use Doingfb\AdSlot\Notification\ItemReviewedBlueprint;
use Doingfb\AdSlot\Serializer\ItemSerializer;
use Doingfb\AdSlot\Support\AdSlotSettings;
use Doingfb\AdSlot\Support\DiscountCodeService;
use Flarum\Api\Serializer\ForumSerializer;
use Flarum\Extend;
use Flarum\User\Event\GroupsChanged;
use Illuminate\Console\Scheduling\Event;

return [
    (new Extend\Frontend('admin'))
        ->js(__DIR__.'/js/dist/admin.js')
        ->css(__DIR__.'/less/admin.less'),

    (new Extend\Frontend('forum'))
        ->js(__DIR__.'/js/dist/forum.js')
        ->css(__DIR__.'/less/forum.less')
        ->route('/providers', 'adslot.providers', ProvidersPage::class)
        ->route('/providers/my', 'adslot.my', MyAdsPage::class)
        ->route('/providers/apply', 'adslot.apply', ApplyPage::class),

    new Extend\Locales(__DIR__.'/locale'),

    (new Extend\View())
        ->namespace('doingfb-adslot', __DIR__.'/views'),

    (new Extend\Routes('api'))
        ->get('/adslot/public/items', 'adslot.public.items', ListPublicItemsController::class)
        ->get('/adslot/forum/config', 'adslot.forum.config', GetForumConfigController::class)
        ->get('/adslot/me/items', 'adslot.me.items', ListMyItemsController::class)
        ->post('/adslot/discount-codes/generate', 'adslot.discount-codes.generate', GenerateDiscountCodeController::class)
        ->post('/adslot/discount-codes/preview', 'adslot.discount-codes.preview', PreviewDiscountCodeController::class)
        ->post('/adslot/upload-image', 'adslot.items.upload-image', UploadImageController::class)
        ->delete('/adslot/upload-image', 'adslot.items.delete-upload-image', DeleteUploadedImageController::class)
        ->post('/adslot/items', 'adslot.items.create', CreateItemController::class)
        ->post('/adslot/items/{id}/renewals', 'adslot.items.renewals.create', CreateItemRenewalController::class)
        ->patch('/adslot/items/{id}', 'adslot.items.update', UpdateMyItemController::class)
        ->post('/adslot/items/{id}/update', 'adslot.items.update.post', UpdateMyItemController::class)
        ->post('/adslot/items/update', 'adslot.items.update.body', UpdateMyItemController::class)
        ->get('/adslot/admin/items', 'adslot.admin.items', AdminListItemsController::class)
        ->get('/adslot/admin/renewals', 'adslot.admin.renewals', AdminListItemRenewalsController::class)
        ->get('/adslot/admin/discount-codes', 'adslot.admin.discount-codes', AdminListDiscountCodesController::class)
        ->post('/adslot/admin/discount-codes/{id}/deactivate', 'adslot.admin.discount-codes.deactivate', DeactivateDiscountCodeController::class)
        ->post('/adslot/admin/discount-codes/deactivate', 'adslot.admin.discount-codes.deactivate.body', DeactivateDiscountCodeController::class)
        ->post('/adslot/admin/discount-codes/{id}/activate', 'adslot.admin.discount-codes.activate', ActivateDiscountCodeController::class)
        ->post('/adslot/admin/discount-codes/activate', 'adslot.admin.discount-codes.activate.body', ActivateDiscountCodeController::class)
        ->delete('/adslot/admin/discount-codes/{id}', 'adslot.admin.discount-codes.delete', DeleteDiscountCodeController::class)
        ->post('/adslot/admin/discount-codes/{id}/delete', 'adslot.admin.discount-codes.delete.post', DeleteDiscountCodeController::class)
        ->post('/adslot/admin/discount-codes/delete', 'adslot.admin.discount-codes.delete.body', DeleteDiscountCodeController::class)
        ->get('/adslot/admin/config', 'adslot.admin.config', GetAdminConfigController::class)
        ->post('/adslot/admin/config', 'adslot.admin.config.save', SaveAdminConfigController::class)
        ->post('/adslot/admin/renewals/{id}/review', 'adslot.admin.renewals.review', ReviewItemRenewalController::class)
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
                'doingfb-adslot.noticeBarEnabled' => $settings->getNoticeBarEnabled(),
                'doingfb-adslot.noticeBarText' => $settings->getNoticeBarText(),
            ];
        }),

    (new Extend\Notification())
        ->type(ItemReviewedBlueprint::class, ItemSerializer::class, ['alert', 'email'])
        ->type(ItemPendingReviewBlueprint::class, ItemSerializer::class, ['alert', 'email'])
        ->type(ItemRenewalPendingReviewBlueprint::class, ItemSerializer::class, ['alert', 'email'])
        ->type(ItemRenewalReviewedBlueprint::class, ItemSerializer::class, ['alert', 'email'])
        ->type(ItemExpiringBlueprint::class, ItemSerializer::class, ['alert', 'email'])
        ->type(ItemExpiredBlueprint::class, ItemSerializer::class, ['alert', 'email'])
        ->type(DiscountCodeUsedBlueprint::class, ItemSerializer::class, ['alert', 'email']),

    (new Extend\Console())
        ->command(NotifyAdSlotExpiryCommand::class)
        ->schedule(NotifyAdSlotExpiryCommand::class, function (Event $event) {
            $event->daily();
        }),

    (new Extend\Event())
        ->listen(GroupsChanged::class, [SyncDiscountCodeEligibility::class, 'handle']),
];
