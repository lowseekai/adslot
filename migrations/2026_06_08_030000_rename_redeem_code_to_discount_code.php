<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;
return [
    'up' => function (Builder $schema) {
        if (!$schema->hasTable('adslot_items')) {
            return;
        }

        if (!$schema->hasColumn('adslot_items', 'discount_code')) {
            $schema->table('adslot_items', function (Blueprint $table) {
                $table->string('discount_code')->nullable()->after('contact_value');
            });
        }

        if ($schema->hasColumn('adslot_items', 'redeem_code')) {
            $schema->getConnection()
                ->table('adslot_items')
                ->whereNull('discount_code')
                ->whereNotNull('redeem_code')
                ->update([
                    'discount_code' => $schema->getConnection()->raw('redeem_code'),
                ]);

            $schema->table('adslot_items', function (Blueprint $table) {
                $table->dropColumn('redeem_code');
            });
        }
    },
    'down' => function (Builder $schema) {
        if (!$schema->hasTable('adslot_items')) {
            return;
        }

        if (!$schema->hasColumn('adslot_items', 'redeem_code')) {
            $schema->table('adslot_items', function (Blueprint $table) {
                $table->string('redeem_code')->nullable()->after('contact_value');
            });
        }

        if ($schema->hasColumn('adslot_items', 'discount_code')) {
            $schema->getConnection()
                ->table('adslot_items')
                ->whereNull('redeem_code')
                ->whereNotNull('discount_code')
                ->update([
                    'redeem_code' => $schema->getConnection()->raw('discount_code'),
                ]);

            $schema->table('adslot_items', function (Blueprint $table) {
                $table->dropColumn('discount_code');
            });
        }
    },
];
