<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

return [
    'up' => function (Builder $schema) {
        if (!$schema->hasTable('adslot_items')) {
            return;
        }

        $schema->table('adslot_items', function (Blueprint $table) use ($schema) {
            if (!$schema->hasColumn('adslot_items', 'expiry_warning_notified_at')) {
                $table->timestamp('expiry_warning_notified_at')->nullable()->after('ends_at');
            }

            if (!$schema->hasColumn('adslot_items', 'expired_notified_at')) {
                $table->timestamp('expired_notified_at')->nullable()->after('expiry_warning_notified_at');
            }
        });
    },
    'down' => function (Builder $schema) {
        if (!$schema->hasTable('adslot_items')) {
            return;
        }

        $schema->table('adslot_items', function (Blueprint $table) use ($schema) {
            foreach (['expiry_warning_notified_at', 'expired_notified_at'] as $column) {
                if ($schema->hasColumn('adslot_items', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    },
];
