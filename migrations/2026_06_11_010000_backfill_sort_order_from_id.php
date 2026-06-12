<?php

use Illuminate\Database\Schema\Builder;

return [
    'up' => function (Builder $schema) {
        if (!$schema->hasTable('adslot_items')) {
            return;
        }

        resolve('db')
            ->table('adslot_items')
            ->where(function ($query) {
                $query->whereNull('sort_order')
                    ->orWhere('sort_order', '<', 1);
            })
            ->orderBy('id')
            ->get(['id'])
            ->each(function ($row) {
                resolve('db')
                    ->table('adslot_items')
                    ->where('id', $row->id)
                    ->update(['sort_order' => max(1, (int) $row->id)]);
            });
    },
    'down' => function (Builder $schema) {
    },
];
