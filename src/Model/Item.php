<?php

namespace Doingfb\AdSlot\Model;

use Flarum\Database\AbstractModel;
use Flarum\User\User;

class Item extends AbstractModel
{
    protected $table = 'adslot_items';
    public $timestamps = true;

    protected $casts = [
        'is_visible' => 'boolean',
        'ad_fee_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'payable_amount' => 'decimal:2',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
