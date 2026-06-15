{{ $translator->trans('doingfb-adslot.email.common.greeting', ['{username}' => $user->display_name]) }}

{{ $translator->trans('doingfb-adslot.email.discount_code_used.subject') }}

{{ $translator->trans('doingfb-adslot.email.common.merchant_label') }}: {{ $blueprint->payload['merchantName'] ?? '' }}
{{ $translator->trans('doingfb-adslot.email.discount_code_used.code_label') }}: {{ $blueprint->payload['code'] ?? '' }}
{{ $translator->trans('doingfb-adslot.email.discount_code_used.amount_label') }}: {{ $blueprint->payload['amount'] ?? '0.00' }}
{{ $translator->trans('doingfb-adslot.email.discount_code_used.body') }}
