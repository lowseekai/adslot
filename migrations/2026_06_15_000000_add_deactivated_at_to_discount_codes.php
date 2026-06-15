<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

return [
    'up' => function (Builder $schema) {
        if (!$schema->hasTable('adslot_discount_codes') || $schema->hasColumn('adslot_discount_codes', 'deactivated_at')) {
            return;
        }

        $schema->table('adslot_discount_codes', function (Blueprint $table) {
            $table->timestamp('deactivated_at')->nullable()->after('expires_at');
            $table->index('deactivated_at');
        });
    },
    'down' => function (Builder $schema) {
        if (!$schema->hasTable('adslot_discount_codes') || !$schema->hasColumn('adslot_discount_codes', 'deactivated_at')) {
            return;
        }

        $schema->table('adslot_discount_codes', function (Blueprint $table) {
            $table->dropIndex(['deactivated_at']);
            $table->dropColumn('deactivated_at');
        });
    },
];
