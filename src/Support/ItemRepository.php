<?php

namespace Doingfb\AdSlot\Support;

use Doingfb\AdSlot\Model\Item;
use Flarum\User\User;
use Illuminate\Support\Carbon;
use Illuminate\Database\Eloquent\Builder;

class ItemRepository
{
    public function queryVisible(): Builder
    {
        $now = Carbon::now();

        return Item::query()
            ->where('status', 'approved')
            ->where('is_visible', true)
            ->where(function (Builder $query) use ($now) {
                $query->whereNull('starts_at')
                    ->orWhere('starts_at', '<=', $now);
            })
            ->where(function (Builder $query) use ($now) {
                $query->whereNull('ends_at')
                    ->orWhere('ends_at', '>=', $now);
            })
            ->orderBy('sort_order')
            ->orderByDesc('id');
    }

    public function queryForUser(User $user): Builder
    {
        return Item::query()
            ->where('user_id', $user->id)
            ->orderByDesc('created_at');
    }

    public function queryForAdmin(?string $status = null, $isVisible = null, ?string $keyword = null): Builder
    {
        $query = Item::query()->orderByDesc('created_at');

        if ($status !== null && $status !== '') {
            $query->where('status', $status);
        }

        if ($isVisible !== null && $isVisible !== '') {
            $query->where('is_visible', filter_var($isVisible, FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE) ?? false);
        }

        if ($keyword !== null && $keyword !== '') {
            $query->where('merchant_name', 'like', '%'.$keyword.'%');
        }

        return $query;
    }
}
