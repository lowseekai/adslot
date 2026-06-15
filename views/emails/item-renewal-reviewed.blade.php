{{ $translator->trans('doingfb-adslot.email.common.greeting', ['{username}' => $user->display_name]) }}

{{ $translator->trans('doingfb-adslot.email.item_renewal_reviewed.subject') }}

{{ $translator->trans('doingfb-adslot.email.common.merchant_label') }}: {{ $blueprint->payload['merchantName'] ?? '' }}
{{ $translator->trans('doingfb-adslot.email.item_renewal_reviewed.status_label') }}: {{ $translator->trans('doingfb-adslot.email.item_renewal_reviewed.status_'.$blueprint->payload['status']) }}
{{ $translator->trans('doingfb-adslot.email.item_renewal_reviewed.duration_label') }}: {{ $blueprint->payload['durationMonths'] ?? 1 }} {{ $translator->trans('doingfb-adslot.email.common.month_unit') }}
{{ $translator->trans('doingfb-adslot.email.item_renewal_reviewed.old_ends_at_label') }}: {{ $blueprint->payload['oldEndsAt'] ?? '-' }}
{{ $translator->trans('doingfb-adslot.email.item_renewal_reviewed.new_ends_at_label') }}: {{ $blueprint->payload['newEndsAt'] ?? '-' }}
{{ $translator->trans('doingfb-adslot.email.item_renewal_reviewed.review_note_label') }}: {{ $blueprint->payload['reviewNote'] ?: $translator->trans('doingfb-adslot.email.item_renewal_reviewed.no_review_note') }}
