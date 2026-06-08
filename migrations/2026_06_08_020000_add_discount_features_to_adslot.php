<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

return [
    'up' => function (Builder $schema) {
        if ($schema->hasTable('adslot_items')) {
            $schema->table('adslot_items', function (Blueprint $table) use ($schema) {
                if (!$schema->hasColumn('adslot_items', 'payment_proof_path')) {
                    $table->string('payment_proof_path')->nullable()->after('discount_code');
                }

                if (!$schema->hasColumn('adslot_items', 'ad_fee_amount')) {
                    $table->decimal('ad_fee_amount', 10, 2)->default(0)->after('payment_proof_path');
                }

                if (!$schema->hasColumn('adslot_items', 'discount_amount')) {
                    $table->decimal('discount_amount', 10, 2)->default(0)->after('ad_fee_amount');
                }

                if (!$schema->hasColumn('adslot_items', 'payable_amount')) {
                    $table->decimal('payable_amount', 10, 2)->default(0)->after('discount_amount');
                }
            });
        }

        if (!$schema->hasTable('adslot_discount_codes')) {
            $schema->create('adslot_discount_codes', function (Blueprint $table) {
                $table->increments('id');
                $table->string('code')->unique();
                $table->decimal('amount', 10, 2)->default(0);
                $table->text('allowed_group_ids')->nullable();
                $table->timestamp('starts_at')->nullable();
                $table->timestamp('expires_at')->nullable();
                $table->unsignedInteger('created_by')->nullable();
                $table->unsignedInteger('used_by')->nullable();
                $table->unsignedInteger('used_item_id')->nullable();
                $table->timestamp('used_at')->nullable();
                $table->boolean('is_used')->default(false);
                $table->timestamps();

                $table->index(['code', 'is_used']);
                $table->index('expires_at');
            });
        }
    },
    'down' => function (Builder $schema) {
        if ($schema->hasTable('adslot_items')) {
            $schema->table('adslot_items', function (Blueprint $table) use ($schema) {
                foreach (['payment_proof_path', 'ad_fee_amount', 'discount_amount', 'payable_amount'] as $column) {
                    if ($schema->hasColumn('adslot_items', $column)) {
                        $table->dropColumn($column);
                    }
                }
            });
        }

        $schema->dropIfExists('adslot_discount_codes');
    },
];
