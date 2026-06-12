<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

return [
    'up' => function (Builder $schema) {
        if (!$schema->hasTable('adslot_discount_codes')) {
            return;
        }

        $schema->table('adslot_discount_codes', function (Blueprint $table) use ($schema) {
            if (!$schema->hasColumn('adslot_discount_codes', 'owner_user_id')) {
                $table->unsignedInteger('owner_user_id')->nullable()->after('created_by');
                $table->index(['owner_user_id', 'is_used'], 'adslot_discount_codes_owner_used_idx');
            }
        });
    },
    'down' => function (Builder $schema) {
        if (!$schema->hasTable('adslot_discount_codes') || !$schema->hasColumn('adslot_discount_codes', 'owner_user_id')) {
            return;
        }

        $schema->table('adslot_discount_codes', function (Blueprint $table) {
            $table->dropIndex('adslot_discount_codes_owner_used_idx');
            $table->dropColumn('owner_user_id');
        });
    },
];
