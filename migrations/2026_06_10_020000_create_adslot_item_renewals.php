<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

return [
    'up' => function (Builder $schema) {
        if ($schema->hasTable('adslot_item_renewals')) {
            return;
        }

        $schema->create('adslot_item_renewals', function (Blueprint $table) {
            $table->increments('id');
            $table->unsignedInteger('item_id');
            $table->unsignedInteger('user_id');
            $table->unsignedSmallInteger('duration_months')->default(1);
            $table->string('contact_type', 32)->nullable();
            $table->string('contact_value')->nullable();
            $table->string('discount_code')->nullable();
            $table->string('payment_proof_path')->nullable();
            $table->decimal('ad_fee_amount', 10, 2)->default(0);
            $table->decimal('discount_amount', 10, 2)->default(0);
            $table->decimal('payable_amount', 10, 2)->default(0);
            $table->string('status')->default('pending');
            $table->timestamp('old_ends_at')->nullable();
            $table->timestamp('new_ends_at')->nullable();
            $table->text('review_note')->nullable();
            $table->unsignedInteger('reviewed_by')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->index(['item_id', 'status']);
            $table->index(['user_id', 'status']);
            $table->index('created_at');
        });
    },
    'down' => function (Builder $schema) {
        $schema->dropIfExists('adslot_item_renewals');
    },
];
