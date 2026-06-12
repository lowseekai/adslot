<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

return [
    'up' => function (Builder $schema) {
        if (!$schema->hasTable('adslot_discount_codes')) {
            return;
        }

        $schema->table('adslot_discount_codes', function (Blueprint $table) use ($schema) {
            if (!$schema->hasColumn('adslot_discount_codes', 'usage_limit')) {
                $table->unsignedInteger('usage_limit')->default(1)->after('used_at');
            }

            if (!$schema->hasColumn('adslot_discount_codes', 'used_count')) {
                $table->unsignedInteger('used_count')->default(0)->after('usage_limit');
            }
        });

        $schema->getConnection()->table('adslot_discount_codes')
            ->where('is_used', true)
            ->where(function ($query) {
                $query->whereNull('used_count')->orWhere('used_count', '<', 1);
            })
            ->update(['used_count' => 1]);

        $schema->getConnection()->table('adslot_discount_codes')
            ->where(function ($query) {
                $query->whereNull('usage_limit')->orWhere('usage_limit', '<', 1);
            })
            ->update(['usage_limit' => 1]);
    },
    'down' => function (Builder $schema) {
        if (!$schema->hasTable('adslot_discount_codes')) {
            return;
        }

        $schema->table('adslot_discount_codes', function (Blueprint $table) use ($schema) {
            if ($schema->hasColumn('adslot_discount_codes', 'used_count')) {
                $table->dropColumn('used_count');
            }

            if ($schema->hasColumn('adslot_discount_codes', 'usage_limit')) {
                $table->dropColumn('usage_limit');
            }
        });
    },
];
