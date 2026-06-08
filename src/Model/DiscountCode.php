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
        'starts_at' => 'datetime',
        'expires_at' => 'datetime',
        'used_at' => 'datetime',
        'is_used' => 'boolean',
    ];
}
