<?php

use IlluminateDatabaseSchemaBlueprint;
use IlluminateDatabaseSchemaBuilder;

return [
    'up' => function (Builder $schema) {
        if (!$schema->hasTable('adslot_items')) {
            return;
        }

        $schema->table('adslot_items', function (Blueprint $table) use ($schema) {
            if (!$schema->hasColumn('adslot_items', 'point_transaction_id')) {
                $table->unsignedInteger('point_transaction_id')->nullable()->after('payable_amount');
            }

            if (!$schema->hasColumn('adslot_items', 'points_refunded_at')) {
                $table->timestamp('points_refunded_at')->nullable()->after('point_transaction_id');
            }
        });
    },
    'down' => function (Builder $schema) {
        if (!$schema->hasTable('adslot_items')) {
            return;
        }

        $schema->table('adslot_items', function (Blueprint $table) use ($schema) {
            if ($schema->hasColumn('adslot_items', 'points_refunded_at')) {
                $table->dropColumn('points_refunded_at');
            }

            if ($schema->hasColumn('adslot_items', 'point_transaction_id')) {
                $table->dropColumn('point_transaction_id');
            }
        });
    },
];
