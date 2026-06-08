<?php

namespace Doingfb\AdSlot\Support;

use Flarum\Foundation\ValidationException;
use Psr\Http\Message\UploadedFileInterface;

class ImageUploader
{
    public function uploadAdImage(?UploadedFileInterface $file): array
    {
        return $this->upload($file, true, '请先选择广告图。', '广告图上传失败，请重试。');
    }

    public function uploadPaymentProof(?UploadedFileInterface $file): array
    {
        return $this->upload($file, false, '请先上传支付凭证。', '支付凭证上传失败，请重试。');
    }

    protected function upload(?UploadedFileInterface $file, bool $requireSquare, string $missingMessage, string $uploadErrorMessage): array
    {
        $this->assertFileRequired($file, $missingMessage, $uploadErrorMessage);

        $tmpPath = $this->moveToTemp($file);

        try {
            $this->assertImageMime($file, $tmpPath);
            [$width, $height] = $this->assertImageDimensions($tmpPath, $requireSquare);
            $filename = $this->generateFilename($file);
            $relativePath = 'assets/adslot/'.$filename;
            $targetPath = public_path($relativePath);

            if (!is_dir(dirname($targetPath))) {
                mkdir(dirname($targetPath), 0775, true);
            }

            if (!rename($tmpPath, $targetPath)) {
                throw new ValidationException(['message' => '广告图保存失败。']);
            }

            return [
                'path' => '/'.$relativePath,
                'url' => '/'.$relativePath,
                'width' => $width,
                'height' => $height,
            ];
        } finally {
            if (is_file($tmpPath)) {
                @unlink($tmpPath);
            }
        }
    }

    protected function assertFileRequired(?UploadedFileInterface $file, string $missingMessage, string $uploadErrorMessage): void
    {
        if (!$file) {
            throw new ValidationException(['message' => $missingMessage]);
        }

        if ($file->getError() !== UPLOAD_ERR_OK) {
            throw new ValidationException(['message' => $uploadErrorMessage]);
        }
    }

    protected function moveToTemp(UploadedFileInterface $file): string
    {
        $tmpPath = tempnam(sys_get_temp_dir(), 'adslot_');

        if ($tmpPath === false) {
            throw new ValidationException(['message' => '临时文件创建失败，请稍后重试。']);
        }

        $file->moveTo($tmpPath);

        return $tmpPath;
    }

    protected function assertImageMime(UploadedFileInterface $file, string $tmpPath): void
    {
        $clientType = strtolower((string) $file->getClientMediaType());
        $allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

        if (!in_array($clientType, $allowedTypes, true) && @getimagesize($tmpPath) === false) {
            throw new ValidationException(['message' => '仅支持 JPG、PNG、WEBP 格式的图片。']);
        }
    }

    protected function assertImageDimensions(string $tmpPath, bool $requireSquare): array
    {
        $info = @getimagesize($tmpPath);

        if ($info === false) {
            throw new ValidationException(['message' => '图片文件无效，请重新上传。']);
        }

        [$width, $height] = $info;

        if ($requireSquare && $width !== $height) {
            throw new ValidationException(['message' => '广告图需为 1:1 比例。']);
        }

        return [$width, $height];
    }

    protected function generateFilename(UploadedFileInterface $file): string
    {
        $extension = strtolower(pathinfo((string) $file->getClientFilename(), PATHINFO_EXTENSION));

        if ($extension === '') {
            $extension = 'png';
        }

        return date('YmdHis').'_'.bin2hex(random_bytes(6)).'.'.$extension;
    }
}
