<?php

namespace Doingfb\AdSlot\Notification;

use Doingfb\AdSlot\Model\Item;
use Flarum\Database\AbstractModel;
use Flarum\Notification\Blueprint\BlueprintInterface;
use Flarum\Notification\MailableInterface;
use Flarum\User\User;
use Flarum\Locale\TranslatorInterface;

class ItemExpiringBlueprint implements BlueprintInterface, MailableInterface
{
    public function __construct(
        public Item $item,
        public array $payload
    ) {
    }

    public function getSubject(): ?AbstractModel
    {
        return $this->item;
    }

    public function getFromUser(): ?User
    {
        return null;
    }

    public function getData(): mixed
    {
        return $this->payload;
    }

    public function getEmailViews(): array
    {
        return ['text' => 'doingfb-adslot::emails.item-expiring', 'html' => 'doingfb-adslot::emails.item-expiring'];
    }

    public function getEmailSubject(TranslatorInterface $translator): string
    {
        return $translator->trans('doingfb-adslot.email.item_expiring.subject');
    }

    public static function getType(): string
    {
        return 'adslotItemExpiring';
    }

    public static function getSubjectModel(): string
    {
        return Item::class;
    }
}
