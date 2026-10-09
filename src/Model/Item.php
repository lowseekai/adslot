<?php

namespace Doingfb\AdSlot\Model;

use Flarum\Database\AbstractModel;
use Flarum\User\User;

class Item extends AbstractModel
{
    protected $table = 'adslot_items';
    public $timestamps = true;

    protected $casts = [
        'is_pinned' => 'boolean',
        'is_visible' => 'boolean',
        'duration_months' => 'integer',
        'ad_fee_amount' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'payable_amount' => 'decimal:2',
        'point_transaction_id' => 'integer',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'points_refunded_at' => 'datetime',
        'expiry_warning_notified_at' => 'datetime',
        'expired_notified_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function renewals()
    {
        return $this->hasMany(ItemRenewal::class);
    }

    public function pendingRenewals()
    {
        return $this->hasMany(ItemRenewal::class)->where('status', 'pending')->orderByDesc('created_at');
    }
}
