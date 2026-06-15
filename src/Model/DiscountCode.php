<?php

namespace Doingfb\AdSlot\Model;

use Flarum\Database\AbstractModel;

class DiscountCode extends AbstractModel
{
    protected $table = 'adslot_discount_codes';

    public $timestamps = true;

    protected $casts = [
        'amount' => 'decimal:2',
        'allowed_group_ids' => 'array',
        'grant_group_id' => 'integer',
        'owner_user_id' => 'integer',
        'usage_limit' => 'integer',
        'used_count' => 'integer',
        'duration_months' => 'integer',
        'starts_at' => 'datetime',
        'expires_at' => 'datetime',
        'deactivated_at' => 'datetime',
        'used_at' => 'datetime',
        'is_used' => 'boolean',
    ];
}
