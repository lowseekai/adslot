<?php

use Carbon\Carbon;
use Doingfb\AdSlot\Support\AdSlotTime;
use Illuminate\Database\Schema\Builder;

return [
    'up' => function (Builder $schema) {
        $connection = $schema->getConnection();

        $convertTable = function (string $table, array $columns) use ($schema, $connection) {
            if (!$schema->hasTable($table)) {
                return;
            }

            $availableColumns = array_values(array_filter(
                $columns,
                fn (string $column) => $schema->hasColumn($table, $column)
            ));

            if ($availableColumns === []) {
                return;
            }

            $lastId = 0;

            do {
                $rows = $connection->table($table)
                    ->select(array_merge(['id'], $availableColumns))
                    ->where('id', '>', $lastId)
                    ->orderBy('id')
                    ->limit(100)
                    ->get();

                foreach ($rows as $row) {
                    $updates = [];

                    foreach ($availableColumns as $column) {
                        $value = $row->{$column} ?? null;

                        if (!$value) {
                            continue;
                        }

                        $updates[$column] = Carbon::parse((string) $value, AdSlotTime::DISPLAY_TIMEZONE)
                            ->setTimezone(AdSlotTime::STORAGE_TIMEZONE)
                            ->format('Y-m-d H:i:s');
                    }

                    if ($updates !== []) {
                        $connection->table($table)->where('id', $row->id)->update($updates);
                    }

                    $lastId = (int) $row->id;
                }
            } while ($rows->isNotEmpty());
        };

        $convertTable('adslot_discount_codes', ['starts_at', 'expires_at', 'used_at']);
        $convertTable('adslot_items', ['starts_at', 'ends_at']);
    },
    'down' => function (Builder $schema) {
        $connection = $schema->getConnection();

        $convertTable = function (string $table, array $columns) use ($schema, $connection) {
            if (!$schema->hasTable($table)) {
                return;
            }

            $availableColumns = array_values(array_filter(
                $columns,
                fn (string $column) => $schema->hasColumn($table, $column)
            ));

            if ($availableColumns === []) {
                return;
            }

            $lastId = 0;

            do {
                $rows = $connection->table($table)
                    ->select(array_merge(['id'], $availableColumns))
                    ->where('id', '>', $lastId)
                    ->orderBy('id')
                    ->limit(100)
                    ->get();

                foreach ($rows as $row) {
                    $updates = [];

                    foreach ($availableColumns as $column) {
                        $value = $row->{$column} ?? null;

                        if (!$value) {
                            continue;
                        }

                        $updates[$column] = Carbon::parse((string) $value, AdSlotTime::STORAGE_TIMEZONE)
                            ->setTimezone(AdSlotTime::DISPLAY_TIMEZONE)
                            ->format('Y-m-d H:i:s');
                    }

                    if ($updates !== []) {
                        $connection->table($table)->where('id', $row->id)->update($updates);
                    }

                    $lastId = (int) $row->id;
                }
            } while ($rows->isNotEmpty());
        };

        $convertTable('adslot_discount_codes', ['starts_at', 'expires_at', 'used_at']);
        $convertTable('adslot_items', ['starts_at', 'ends_at']);
    },
];
