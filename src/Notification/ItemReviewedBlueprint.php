<?php

namespace Doingfb\AdSlot\Notification;

use Doingfb\AdSlot\Model\Item;
use Flarum\Database\AbstractModel;
use Flarum\Notification\Blueprint\BlueprintInterface;
use Flarum\Notification\MailableInterface;
use Flarum\User\User;
use Flarum\Locale\TranslatorInterface;

class ItemReviewedBlueprint implements BlueprintInterface, MailableInterface
{
    public function __construct(
        public Item $item,
        public User $reviewer,
        public array $payload
    ) {
    }

    public function getSubject(): ?AbstractModel
    {
        return $this->item;
    }

    public function getFromUser(): ?User
    {
        return $this->reviewer;
    }

    public function getData(): mixed
    {
        return $this->payload;
    }

    public function getEmailViews(): array
    {
        return ['text' => 'doingfb-adslot::emails.item-reviewed', 'html' => 'doingfb-adslot::emails.item-reviewed'];
    }

    public function getEmailSubject(TranslatorInterface $translator): string
    {
        return $translator->trans('doingfb-adslot.email.item_reviewed.subject');
    }

    public static function getType(): string
    {
        return 'adslotItemReviewed';
    }

    public static function getSubjectModel(): string
    {
        return Item::class;
    }
}
