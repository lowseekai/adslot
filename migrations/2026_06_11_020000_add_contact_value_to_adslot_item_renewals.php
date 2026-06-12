<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

return [
    'up' => function (Builder $schema) {
        if (!$schema->hasTable('adslot_item_renewals') || $schema->hasColumn('adslot_item_renewals', 'contact_value')) {
            return;
        }

        $schema->table('adslot_item_renewals', function (Blueprint $table) {
            $table->string('contact_value')->nullable()->after('contact_type');
        });
    },
    'down' => function (Builder $schema) {
        if (!$schema->hasTable('adslot_item_renewals') || !$schema->hasColumn('adslot_item_renewals', 'contact_value')) {
            return;
        }

        $schema->table('adslot_item_renewals', function (Blueprint $table) {
            $table->dropColumn('contact_value');
        });
    },
];
