{{ $translator->trans('doingfb-adslot.email.common.greeting', ['{username}' => $user->display_name]) }}

{{ $translator->trans('doingfb-adslot.email.item_reviewed.subject') }}

{{ $translator->trans('doingfb-adslot.email.item_reviewed.merchant_label') }}: {{ $blueprint->payload['merchantName'] ?? '' }}
{{ $translator->trans('doingfb-adslot.email.item_reviewed.status_label') }}: {{ $translator->trans('doingfb-adslot.email.item_reviewed.status_'.$blueprint->payload['status']) }}
{{ $translator->trans('doingfb-adslot.email.item_reviewed.visibility_label') }}: {{ $translator->trans('doingfb-adslot.email.item_reviewed.visibility_'.($blueprint->payload['isVisible'] ? 'visible' : 'hidden')) }}
{{ $translator->trans('doingfb-adslot.email.item_reviewed.review_note_label') }}: {{ $blueprint->payload['reviewNote'] ?: $translator->trans('doingfb-adslot.email.item_reviewed.no_review_note') }}
