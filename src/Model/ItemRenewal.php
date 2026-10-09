<?php

namespace Doingfb\AdSlot\Model;

use Flarum\Database\AbstractModel;
use Flarum\User\User;

class ItemRenewal extends AbstractModel
{
    protected $table = 'adslot_item_renewals';
    public $timestamps = true;

    protected $casts = [
        'duration_months' => 'integer',
        'ad_fee_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'payable_amount' => 'decimal:2',
        'point_transaction_id' => 'integer',
        'points_refunded_at' => 'datetime',
        'old_ends_at' => 'datetime',
        'new_ends_at' => 'datetime',
        'reviewed_at' => 'datetime',
    ];

    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
