<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

return [
    'up' => function (Builder $schema) {
        if ($schema->hasTable('adslot_items') && !$schema->hasColumn('adslot_items', 'duration_months')) {
            $schema->table('adslot_items', function (Blueprint $table) {
                $table->unsignedSmallInteger('duration_months')->default(1)->after('payment_proof_path');
            });
        }
    },
    'down' => function (Builder $schema) {
        if ($schema->hasTable('adslot_items') && $schema->hasColumn('adslot_items', 'duration_months')) {
            $schema->table('adslot_items', function (Blueprint $table) {
                $table->dropColumn('duration_months');
            });
        }
    },
];
