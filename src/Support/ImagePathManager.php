<?php

namespace Doingfb\AdSlot\Support;

use Doingfb\AdSlot\Model\Item;

class ImagePathManager
{
    public function isManagedPath(?string $path): bool
    {
        if (!$path) {
            return false;
        }

        return str_starts_with($path, '/assets/adslot/');
    }

    public function deleteIfManaged(?string $path): void
    {
        if (!$this->isManagedPath($path)) {
            return;
        }

        $fullPath = public_path(ltrim($path, '/'));

        if (is_file($fullPath)) {
            @unlink($fullPath);
        }
    }

    public function deleteIfManagedAndUnused(?string $path, ?int $exceptItemId = null): void
    {
        if (!$this->isManagedPath($path)) {
            return;
        }

        $query = Item::query()->where('image_path', $path);

        if ($exceptItemId) {
            $query->where('id', '!=', $exceptItemId);
        }

        if ($query->exists()) {
            return;
        }

        $this->deleteIfManaged($path);
    }
}
