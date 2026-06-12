<?php

use Carbon\Carbon;
use Doingfb\AdSlot\Support\AdSlotTime;
use Illuminate\Database\Schema\Builder;

return [
    'up' => function (Builder $schema) {
        if (!$schema->hasTable('adslot_items')
            || !$schema->hasColumn('adslot_items', 'starts_at')
            || !$schema->hasColumn('adslot_items', 'ends_at')
            || !$schema->hasColumn('adslot_items', 'duration_months')
        ) {
            return;
        }

        $connection = $schema->getConnection();
        $lastId = 0;

        do {
            $rows = $connection->table('adslot_items')
                ->select(['id', 'duration_months', 'created_at', 'updated_at'])
                ->where('id', '>', $lastId)
                ->where('status', 'approved')
                ->whereNull('starts_at')
                ->whereNull('ends_at')
                ->orderBy('id')
                ->limit(100)
                ->get();

            foreach ($rows as $row) {
                $approvedAt = Carbon::parse((string) ($row->updated_at ?: $row->created_at ?: AdSlotTime::now()), AdSlotTime::STORAGE_TIMEZONE);
                $durationMonths = in_array((int) $row->duration_months, [1, 3, 6, 12], true) ? (int) $row->duration_months : 1;

                $connection->table('adslot_items')->where('id', $row->id)->update([
                    'starts_at' => $approvedAt->copy()->setTimezone(AdSlotTime::STORAGE_TIMEZONE)->format('Y-m-d H:i:s'),
                    'ends_at' => AdSlotTime::endAfterNaturalMonths($approvedAt, $durationMonths)->format('Y-m-d H:i:s'),
                ]);

                $lastId = (int) $row->id;
            }
        } while ($rows->isNotEmpty());
    },
    'down' => function (Builder $schema) {
    },
];
