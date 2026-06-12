<?php

namespace Doingfb\AdSlot\Notification;

use Doingfb\AdSlot\Model\Item;
use Flarum\Notification\Blueprint\BlueprintInterface;
use Flarum\Notification\MailableInterface;
use Flarum\User\User;
use Symfony\Contracts\Translation\TranslatorInterface;

class DiscountCodeUsedBlueprint implements BlueprintInterface, MailableInterface
{
    public function __construct(
        public Item $item,
        public User $user,
        public array $payload
    ) {
    }

    public function getSubject()
    {
        return $this->item;
    }

    public function getFromUser()
    {
        return $this->user;
    }

    public function getData()
    {
        return $this->payload;
    }

    public function getEmailView()
    {
        return ['text' => 'doingfb-adslot::emails.discount-code-used'];
    }

    public function getEmailSubject(TranslatorInterface $translator)
    {
        return $translator->trans('doingfb-adslot.email.discount_code_used.subject');
    }

    public static function getType()
    {
        return 'adslotDiscountCodeUsed';
    }

    public static function getSubjectModel()
    {
        return Item::class;
    }
}
