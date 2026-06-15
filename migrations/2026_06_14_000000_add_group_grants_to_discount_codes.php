<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

return [
    'up' => function (Builder $schema) {
        if ($schema->hasTable('adslot_discount_codes')) {
            $schema->table('adslot_discount_codes', function (Blueprint $table) use ($schema) {
                if (!$schema->hasColumn('adslot_discount_codes', 'grant_group_id')) {
                    $table->unsignedInteger('grant_group_id')->nullable()->after('allowed_group_ids');
                    $table->index('grant_group_id');
                }
            });
        }

        if (!$schema->hasTable('adslot_discount_group_grants')) {
            $schema->create('adslot_discount_group_grants', function (Blueprint $table) {
                $table->increments('id');
                $table->unsignedInteger('user_id');
                $table->unsignedInteger('group_id');
                $table->unsignedInteger('item_id');
                $table->unsignedInteger('renewal_id')->nullable();
                $table->unsignedInteger('discount_code_id');
                $table->timestamp('starts_at')->nullable();
                $table->timestamp('ends_at')->nullable();
                $table->timestamp('revoked_at')->nullable();
                $table->boolean('was_member_before')->default(false);
                $table->timestamps();

                $table->index(['user_id', 'group_id', 'revoked_at'], 'adslot_group_grants_user_group_active_idx');
                $table->index(['ends_at', 'revoked_at'], 'adslot_group_grants_expiry_idx');
                $table->index('item_id');
                $table->index('renewal_id');
                $table->index('discount_code_id');
            });
        }
    },
    'down' => function (Builder $schema) {
        $schema->dropIfExists('adslot_discount_group_grants');

        if ($schema->hasTable('adslot_discount_codes') && $schema->hasColumn('adslot_discount_codes', 'grant_group_id')) {
            $schema->table('adslot_discount_codes', function (Blueprint $table) {
                $table->dropIndex(['grant_group_id']);
                $table->dropColumn('grant_group_id');
            });
        }
    },
];

