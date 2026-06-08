<?php

namespace Doingfb\AdSlot\Support;

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
}
