{{ $translator->trans('doingfb-adslot.email.common.greeting', ['{username}' => $user->display_name]) }}

{{ $translator->trans('doingfb-adslot.email.item_renewal_pending_review.subject') }}

{{ $translator->trans('doingfb-adslot.email.common.merchant_label') }}: {{ $blueprint->payload['merchantName'] ?? '' }}
{{ $translator->trans('doingfb-adslot.email.item_renewal_pending_review.applicant_label') }}: {{ $blueprint->payload['applicantDisplayName'] ?? $blueprint->payload['applicantUsername'] ?? '' }}
{{ $translator->trans('doingfb-adslot.email.item_renewal_pending_review.duration_label') }}: {{ $blueprint->payload['durationMonths'] ?? 1 }} {{ $translator->trans('doingfb-adslot.email.common.month_unit') }}
{{ $translator->trans('doingfb-adslot.email.item_renewal_pending_review.payable_label') }}: {{ number_format((float) ($blueprint->payload['payableAmount'] ?? 0), 2) }}
{{ $translator->trans('doingfb-adslot.email.item_renewal_pending_review.body') }}
