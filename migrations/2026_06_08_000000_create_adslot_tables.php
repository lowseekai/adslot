<?php

use Illuminate\Database\Schema\Blueprint;
use Illuminate\Database\Schema\Builder;

return [
    'up' => function (Builder $schema) {
        if (!$schema->hasTable('adslot_items')) {
            $schema->create('adslot_items', function (Blueprint $table) {
                $table->increments('id');
                $table->unsignedInteger('user_id');
                $table->string('merchant_name');
                $table->string('image_path');
                $table->string('target_url');
                $table->string('contact');
                $table->string('contact_type')->nullable();
                $table->string('contact_value')->nullable();
                $table->string('discount_code')->nullable();
                $table->string('status')->default('pending');
                $table->boolean('is_visible')->default(false);
                $table->integer('sort_order')->default(1);
                $table->timestamp('starts_at')->nullable();
                $table->timestamp('ends_at')->nullable();
                $table->text('review_note')->nullable();
                $table->unsignedInteger('reviewed_by')->nullable();
                $table->timestamps();

                $table->index(['status', 'is_visible']);
                $table->index(['starts_at', 'ends_at']);
                $table->index('user_id');
            });
        }
    },
    'down' => function (Builder $schema) {
        $schema->dropIfExists('adslot_items');
    },
];
