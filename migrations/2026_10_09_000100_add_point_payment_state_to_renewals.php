<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

return [
    'up' => function (Builder $schema) {
        if (!$schema->hasTable('adslot_item_renewals')) return;
        $schema->table('adslot_item_renewals', function (Blueprint $table) use ($schema) {
            if (!$schema->hasColumn('adslot_item_renewals', 'point_transaction_id')) $table->unsignedInteger('point_transaction_id')->nullable()->after('payable_amount');
            if (!$schema->hasColumn('adslot_item_renewals', 'points_refunded_at')) $table->timestamp('points_refunded_at')->nullable()->after('point_transaction_id');
        });
    },
    'down' => function (Builder $schema) {
        if (!$schema->hasTable('adslot_item_renewals')) return;
        $schema->table('adslot_item_renewals', function (Blueprint $table) use ($schema) {
            if ($schema->hasColumn('adslot_item_renewals', 'points_refunded_at')) $table->dropColumn('points_refunded_at');
            if ($schema->hasColumn('adslot_item_renewals', 'point_transaction_id')) $table->dropColumn('point_transaction_id');
        });
    },
];
