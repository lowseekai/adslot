<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

return [
    'up' => function (Builder $schema) {
        if (!$schema->hasTable('adslot_discount_codes')) {
            return;
        }

        $schema->table('adslot_discount_codes', function (Blueprint $table) use ($schema) {
            if (!$schema->hasColumn('adslot_discount_codes', 'duration_months')) {
                $table->unsignedSmallInteger('duration_months')->nullable()->after('amount');
            }
        });
    },
    'down' => function (Builder $schema) {
        if (!$schema->hasTable('adslot_discount_codes') || !$schema->hasColumn('adslot_discount_codes', 'duration_months')) {
            return;
        }

        $schema->table('adslot_discount_codes', function (Blueprint $table) {
            $table->dropColumn('duration_months');
        });
    },
];
