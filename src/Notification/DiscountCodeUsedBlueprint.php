<?php

namespace Doingfb\AdSlot\Notification;

use Doingfb\AdSlot\Model\Item;
use Flarum\Database\AbstractModel;
use Flarum\Notification\Blueprint\BlueprintInterface;
use Flarum\Notification\MailableInterface;
use Flarum\User\User;
use Flarum\Locale\TranslatorInterface;

class DiscountCodeUsedBlueprint implements BlueprintInterface, MailableInterface
{
    public function __construct(
        public Item $item,
        public User $user,
        public array $payload
    ) {
    }

    public function getSubject(): ?AbstractModel
    {
        return $this->item;
    }

    public function getFromUser(): ?User
    {
        return $this->user;
    }

    public function getData(): mixed
    {
        return $this->payload;
    }

    public function getEmailViews(): array
    {
        return ['text' => 'doingfb-adslot::emails.discount-code-used', 'html' => 'doingfb-adslot::emails.discount-code-used'];
    }

    public function getEmailSubject(TranslatorInterface $translator): string
    {
        return $translator->trans('doingfb-adslot.email.discount_code_used.subject');
    }

    public static function getType(): string
    {
        return 'adslotDiscountCodeUsed';
    }

    public static function getSubjectModel(): string
    {
        return Item::class;
    }
}
