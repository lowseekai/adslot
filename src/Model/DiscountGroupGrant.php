<?php

namespace Doingfb\AdSlot\Model;

use Flarum\Database\AbstractModel;
use Flarum\Group\Group;
use Flarum\User\User;

class DiscountGroupGrant extends AbstractModel
{
    protected $table = 'adslot_discount_group_grants';

    public $timestamps = true;

    protected $casts = [
        'user_id' => 'integer',
        'group_id' => 'integer',
        'item_id' => 'integer',
        'renewal_id' => 'integer',
        'discount_code_id' => 'integer',
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'revoked_at' => 'datetime',
        'was_member_before' => 'boolean',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function group()
    {
        return $this->belongsTo(Group::class);
    }

    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    public function renewal()
    {
        return $this->belongsTo(ItemRenewal::class);
    }

    public function discountCode()
    {
        return $this->belongsTo(DiscountCode::class);
    }
}

