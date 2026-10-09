<?php

namespace Doingfb\AdSlot\Notification;

use Doingfb\AdSlot\Model\Item;
use Flarum\Database\AbstractModel;
use Flarum\Notification\Blueprint\BlueprintInterface;
use Flarum\Notification\MailableInterface;
use Flarum\User\User;
use Flarum\Locale\TranslatorInterface;

class ItemPendingReviewBlueprint implements BlueprintInterface, MailableInterface
{
    public function __construct(
        public Item $item,
        public User $applicant,
        public array $payload
    ) {
    }

    public function getSubject(): ?AbstractModel
    {
        return $this->item;
    }

    public function getFromUser(): ?User
    {
        return $this->applicant;
    }

    public function getData(): mixed
    {
        return $this->payload;
    }

    public function getEmailViews(): array
    {
        return ['text' => 'doingfb-adslot::emails.item-pending-review', 'html' => 'doingfb-adslot::emails.item-pending-review'];
    }

    public function getEmailSubject(TranslatorInterface $translator): string
    {
        return $translator->trans('doingfb-adslot.email.item_pending_review.subject');
    }

    public static function getType(): string
    {
        return 'adslotItemPendingReview';
    }

    public static function getSubjectModel(): string
    {
        return Item::class;
    }
}
