{{ $translator->trans('doingfb-adslot.email.common.greeting', ['{username}' => $user->display_name]) }}

{{ $translator->trans('doingfb-adslot.email.item_expired.subject') }}

{{ $translator->trans('doingfb-adslot.email.common.merchant_label') }}: {{ $blueprint->payload['merchantName'] ?? '' }}
{{ $translator->trans('doingfb-adslot.email.common.ends_at_label') }}: {{ $blueprint->payload['endsAt'] ?? '' }}
{{ $translator->trans('doingfb-adslot.email.item_expired.body') }}
