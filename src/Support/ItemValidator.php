<?php

namespace Doingfb\AdSlot\Support;

use Flarum\Foundation\ValidationException;

class ItemValidator
{
    public const ALLOWED_STATUSES = ['pending', 'approved', 'rejected'];
    public const ALLOWED_CONTACT_TYPES = ['wechat', 'telegram', 'email'];

    public function validateForCreate(array $input): array
    {
        $data = $this->normalizeBaseFields($input);

        $this->assertRequiredString($data['merchantName'], '商家名称不能为空。');
        $this->assertRequiredString($data['imagePath'], '广告图不能为空。');
        $this->assertRequiredString($data['targetUrl'], '跳转链接不能为空。');
        $this->assertUrl($data['targetUrl'], '跳转链接格式不正确。');
        $this->assertImagePath($data['imagePath']);
        $this->assertContact($data['contactType'], $data['contactValue']);

        return $data;
    }

    public function validateForUserUpdate(array $input): array
    {
        $data = $this->normalizeBaseFields($input);

        $this->assertRequiredString($data['merchantName'], '商家名称不能为空。');
        $this->assertRequiredString($data['imagePath'], '广告图不能为空。');
        $this->assertRequiredString($data['targetUrl'], '跳转链接不能为空。');
        $this->assertUrl($data['targetUrl'], '跳转链接格式不正确。');
        $this->assertImagePath($data['imagePath']);
        $this->assertContact($data['contactType'], $data['contactValue']);

        return $data;
    }

    public function validateForAdminUpdate(array $input): array
    {
        $data = [];

        if (array_key_exists('merchantName', $input)) {
            $data['merchantName'] = trim((string) $input['merchantName']);
            $this->assertRequiredString($data['merchantName'], '商家名称不能为空。');
        }

        if (array_key_exists('imagePath', $input)) {
            $data['imagePath'] = trim((string) $input['imagePath']);
            $this->assertRequiredString($data['imagePath'], '广告图不能为空。');
            $this->assertImagePath($data['imagePath']);
        }

        if (array_key_exists('targetUrl', $input)) {
            $data['targetUrl'] = trim((string) $input['targetUrl']);
            $this->assertRequiredString($data['targetUrl'], '跳转链接不能为空。');
            $this->assertUrl($data['targetUrl'], '跳转链接格式不正确。');
        }

        $hasContactType = array_key_exists('contactType', $input);
        $hasContactValue = array_key_exists('contactValue', $input);

        if ($hasContactType) {
            $data['contactType'] = trim((string) $input['contactType']);
        }

        if ($hasContactValue) {
            $data['contactValue'] = trim((string) $input['contactValue']);
        }

        if ($hasContactType || $hasContactValue) {
            $this->assertContact($data['contactType'] ?? '', $data['contactValue'] ?? '');
        }

        if (array_key_exists('discountCode', $input)) {
            $data['discountCode'] = $input['discountCode'] !== null ? trim((string) $input['discountCode']) : null;
        }

        if (array_key_exists('status', $input)) {
            $data['status'] = (string) $input['status'];

            if (!in_array($data['status'], self::ALLOWED_STATUSES, true)) {
                throw new ValidationException(['message' => '状态值无效。']);
            }
        }

        if (array_key_exists('isVisible', $input)) {
            $data['isVisible'] = (bool) $input['isVisible'];
        }

        if (array_key_exists('sortOrder', $input)) {
            $data['sortOrder'] = (int) $input['sortOrder'];
        }

        $hasStartsAt = array_key_exists('startsAt', $input);
        $hasEndsAt = array_key_exists('endsAt', $input);

        if ($hasStartsAt) {
            $data['startsAt'] = $this->normalizeDateValue($input['startsAt'], '开始时间格式不正确。');
        }

        if ($hasEndsAt) {
            $data['endsAt'] = $this->normalizeDateValue($input['endsAt'], '结束时间格式不正确。');
        }

        if (array_key_exists('paymentProofPath', $input)) {
            $data['paymentProofPath'] = $input['paymentProofPath'] !== null ? trim((string) $input['paymentProofPath']) : null;

            if ($data['paymentProofPath']) {
                $this->assertImagePath($data['paymentProofPath']);
            }
        }

        foreach (['adFeeAmount', 'discountAmount', 'payableAmount'] as $field) {
            if (array_key_exists($field, $input)) {
                $data[$field] = $this->normalizeMoneyValue($input[$field], $field.' 金额格式不正确。');
            }
        }

        if (array_key_exists('reviewNote', $input)) {
            $data['reviewNote'] = $input['reviewNote'] !== null ? trim((string) $input['reviewNote']) : null;
        }

        if (($hasStartsAt || $hasEndsAt) && !empty($data['startsAt']) && !empty($data['endsAt']) && strtotime($data['startsAt']) > strtotime($data['endsAt'])) {
            throw new ValidationException(['message' => '开始时间不能晚于结束时间。']);
        }

        return $data;
    }

    protected function normalizeBaseFields(array $input): array
    {
        $legacyContact = trim((string) ($input['contact'] ?? ''));

        return [
            'merchantName' => trim((string) ($input['merchantName'] ?? '')),
            'imagePath' => trim((string) ($input['imagePath'] ?? '')),
            'targetUrl' => trim((string) ($input['targetUrl'] ?? '')),
            'contactType' => trim((string) ($input['contactType'] ?? '')),
            'contactValue' => trim((string) ($input['contactValue'] ?? $legacyContact)),
            'discountCode' => ($input['discountCode'] ?? null) !== null ? trim((string) $input['discountCode']) : null,
            'paymentProofPath' => ($input['paymentProofPath'] ?? null) !== null ? trim((string) $input['paymentProofPath']) : null,
        ];
    }

    protected function assertRequiredString(string $value, string $message): void
    {
        if ($value === '') {
            throw new ValidationException(['message' => $message]);
        }
    }

    protected function assertUrl(string $value, string $message): void
    {
        if (!filter_var($value, FILTER_VALIDATE_URL)) {
            throw new ValidationException(['message' => $message]);
        }
    }

    protected function assertImagePath(string $value): void
    {
        if (str_starts_with($value, '/')) {
            return;
        }

        $this->assertUrl($value, '图片地址无效。');
    }

    protected function assertContact(string $type, string $value): void
    {
        $this->assertRequiredString($type, '联系方式类型不能为空。');
        $this->assertRequiredString($value, '联系方式账号不能为空。');

        if (!in_array($type, self::ALLOWED_CONTACT_TYPES, true)) {
            throw new ValidationException(['message' => '联系方式类型无效。']);
        }

        if ($type === 'email' && !filter_var($value, FILTER_VALIDATE_EMAIL)) {
            throw new ValidationException(['message' => '邮箱格式不正确。']);
        }

        if ($type === 'telegram' && !preg_match('/^@?[A-Za-z0-9_]{5,}$/', $value)) {
            throw new ValidationException(['message' => 'Telegram 账号格式不正确。']);
        }
    }

    protected function normalizeDateValue(mixed $value, string $message): ?string
    {
        if ($value === null || $value === '') {
            return null;
        }

        $timestamp = strtotime((string) $value);

        if ($timestamp === false) {
            throw new ValidationException(['message' => $message]);
        }

        return date('Y-m-d H:i:s', $timestamp);
    }

    protected function normalizeMoneyValue(mixed $value, string $message): float
    {
        if ($value === null || $value === '') {
            return 0.0;
        }

        if (!is_numeric($value)) {
            throw new ValidationException(['message' => $message]);
        }

        return max(0, round((float) $value, 2));
    }
}
