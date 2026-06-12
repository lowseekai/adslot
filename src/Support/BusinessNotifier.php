<?php

namespace Doingfb\AdSlot\Support;

use Doingfb\AdSlot\Model\DiscountCode;
use Doingfb\AdSlot\Model\Item;
use Doingfb\AdSlot\Model\ItemRenewal;
use Doingfb\AdSlot\Notification\DiscountCodeUsedBlueprint;
use Doingfb\AdSlot\Notification\ItemExpiredBlueprint;
use Doingfb\AdSlot\Notification\ItemExpiringBlueprint;
use Doingfb\AdSlot\Notification\ItemPendingReviewBlueprint;
use Doingfb\AdSlot\Notification\ItemRenewalPendingReviewBlueprint;
use Doingfb\AdSlot\Notification\ItemRenewalReviewedBlueprint;
use Flarum\Group\Group;
use Flarum\Notification\NotificationSyncer;
use Flarum\User\User;

class BusinessNotifier
{
    public function __construct(
        protected NotificationSyncer $notifications
    ) {
    }

    public function notifyPendingReview(Item $item, User $applicant): void
    {
        $admins = User::query()
            ->whereHas('groups', function ($query) {
                $query->where('groups.id', Group::ADMINISTRATOR_ID);
            })
            ->get()
            ->all();

        if ($admins === []) {
            return;
        }

        $this->notifications->sync(
            new ItemPendingReviewBlueprint($item, $applicant, $this->itemPayload($item) + [
                'applicantId' => (int) $applicant->id,
                'applicantUsername' => (string) $applicant->username,
                'applicantDisplayName' => $this->userLabel($applicant),
            ]),
            $admins
        );
    }

    public function notifyRenewalPendingReview(ItemRenewal $renewal, User $applicant): void
    {
        $renewal->loadMissing('item');
        $item = $renewal->item;

        if (!$item) {
            return;
        }

        $admins = User::query()
            ->whereHas('groups', function ($query) {
                $query->where('groups.id', Group::ADMINISTRATOR_ID);
            })
            ->get()
            ->all();

        if ($admins === []) {
            return;
        }

        $this->notifications->sync(
            new ItemRenewalPendingReviewBlueprint($item, $renewal, $applicant, $this->renewalPayload($renewal) + [
                'applicantId' => (int) $applicant->id,
                'applicantUsername' => (string) $applicant->username,
                'applicantDisplayName' => $this->userLabel($applicant),
            ]),
            $admins
        );
    }

    public function notifyRenewalReviewed(ItemRenewal $renewal, User $reviewer): void
    {
        $renewal->loadMissing(['item.user']);
        $item = $renewal->item;

        if (!$item || !$item->user || (int) $item->user->id === (int) $reviewer->id) {
            return;
        }

        $this->notifications->sync(
            new ItemRenewalReviewedBlueprint($item, $renewal, $reviewer, $this->renewalPayload($renewal) + [
                'reviewerId' => (int) $reviewer->id,
                'reviewerUsername' => (string) $reviewer->username,
                'reviewerDisplayName' => $this->userLabel($reviewer),
                'reviewNote' => (string) ($renewal->review_note ?? ''),
            ]),
            [$item->user]
        );
    }

    public function notifyDiscountCodeUsed(Item $item, DiscountCode $discountCode, User $user): void
    {
        if (!$discountCode->owner_user_id) {
            return;
        }

        $owner = User::query()->find((int) $discountCode->owner_user_id);

        if (!$owner) {
            return;
        }

        $this->notifications->sync(
            new DiscountCodeUsedBlueprint($item, $user, $this->itemPayload($item) + [
                'code' => (string) $discountCode->code,
                'amount' => (float) $discountCode->amount,
                'usedBy' => $this->userLabel($user),
            ]),
            [$owner]
        );
    }

    public function notifyItemExpiring(Item $item, int $days = 3): void
    {
        if (!$item->user) {
            return;
        }

        $this->notifications->sync(
            new ItemExpiringBlueprint($item, $this->itemPayload($item) + ['days' => $days]),
            [$item->user]
        );
    }

    public function notifyItemExpired(Item $item): void
    {
        if (!$item->user) {
            return;
        }

        $this->notifications->sync(
            new ItemExpiredBlueprint($item, $this->itemPayload($item)),
            [$item->user]
        );
    }

    protected function itemPayload(Item $item): array
    {
        return [
            'itemId' => (int) $item->id,
            'merchantName' => (string) $item->merchant_name,
            'startsAt' => AdSlotTime::atom($item->starts_at),
            'endsAt' => AdSlotTime::atom($item->ends_at),
        ];
    }

    protected function renewalPayload(ItemRenewal $renewal): array
    {
        $renewal->loadMissing('item');
        $item = $renewal->item;

        return ($item ? $this->itemPayload($item) : []) + [
            'renewalId' => (int) $renewal->id,
            'status' => (string) $renewal->status,
            'durationMonths' => (int) ($renewal->duration_months ?: 1),
            'payableAmount' => (float) $renewal->payable_amount,
            'oldEndsAt' => AdSlotTime::atom($renewal->old_ends_at),
            'newEndsAt' => AdSlotTime::atom($renewal->new_ends_at),
            'createdAt' => AdSlotTime::atom($renewal->created_at),
            'reviewedAt' => AdSlotTime::atom($renewal->reviewed_at),
        ];
    }

    protected function userLabel(User $user): string
    {
        return (string) ($user->display_name ?: $user->username ?: '#'.$user->id);
    }
}
