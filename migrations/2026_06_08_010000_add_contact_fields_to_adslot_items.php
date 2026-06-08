<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

return [
    'up' => function (Builder $schema) {
        if (!$schema->hasTable('adslot_items')) {
            return;
        }

        $hasContactType = $schema->hasColumn('adslot_items', 'contact_type');
        $hasContactValue = $schema->hasColumn('adslot_items', 'contact_value');

        if (!$hasContactType || !$hasContactValue) {
            $schema->table('adslot_items', function (Blueprint $table) use ($hasContactType, $hasContactValue) {
                if (!$hasContactType) {
                    $table->string('contact_type')->nullable()->after('contact');
                }

                if (!$hasContactValue) {
                    $table->string('contact_value')->nullable()->after('contact_type');
                }
            });
        }

        $connection = $schema->getConnection();

        $connection->table('adslot_items')
            ->whereNull('contact_type')
            ->orWhere('contact_type', '')
            ->update([
                'contact_type' => 'wechat',
            ]);

        $connection->table('adslot_items')
            ->whereNull('contact_value')
            ->orWhere('contact_value', '')
            ->update([
                'contact_value' => $connection->raw('contact'),
            ]);
    },
    'down' => function (Builder $schema) {
        if (!$schema->hasTable('adslot_items')) {
            return;
        }

        $hasContactType = $schema->hasColumn('adslot_items', 'contact_type');
        $hasContactValue = $schema->hasColumn('adslot_items', 'contact_value');

        if ($hasContactType || $hasContactValue) {
            $schema->table('adslot_items', function (Blueprint $table) use ($hasContactType, $hasContactValue) {
                if ($hasContactValue) {
                    $table->dropColumn('contact_value');
                }

                if ($hasContactType) {
                    $table->dropColumn('contact_type');
                }
            });
        }
    },
];
