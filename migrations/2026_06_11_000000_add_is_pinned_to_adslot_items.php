<?php

use Flarum\Database\Migration;
use Illuminate\Database\Schema\Blueprint;

return Migration::addColumns('adslot_items', [
    'is_pinned' => ['boolean', 'default' => false, 'after' => 'status'],
]);

