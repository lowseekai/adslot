<?php

namespace Doingfb\AdSlot\Notification;

use Doingfb\AdSlot\Model\Item;
use Flarum\Notification\Blueprint\BlueprintInterface;
use Flarum\Notification\MailableInterface;
use Flarum\User\User;
use Symfony\Contracts\Translation\TranslatorInterface;

class ItemReviewedBlueprint implements BlueprintInterface, MailableInterface
{
    public function __construct(
        public Item $item,
        public User $reviewer,
        public array $payload
    ) {
    }

    public function getSubject()
    {
        return $this->item;
    }

    public function getFromUser()
    {
        return $this->reviewer;
    }

    public function getData()
    {
        return $this->payload;
    }

    public function getEmailView()
    {
        return ['text' => 'doingfb-adslot::emails.item-reviewed'];
    }

    public function getEmailSubject(TranslatorInterface $translator)
    {
        return $translator->trans('doingfb-adslot.email.item_reviewed.subject');
    }

    public static function getType()
    {
        return 'adslotItemReviewed';
    }

    public static function getSubjectModel()
    {
        return Item::class;
    }
}
