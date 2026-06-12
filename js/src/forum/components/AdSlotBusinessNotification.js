import app from 'flarum/forum/app';
import Notification from 'flarum/forum/components/Notification';

const NOTIFICATION_META = {
  adslotItemPendingReview: {
    icon: 'fas fa-clipboard-list',
    textKey: 'item_pending_review_text',
    excerptKey: 'item_pending_review_excerpt',
    href: () => '/admin#/adslot/reviews',
  },
  adslotItemRenewalPendingReview: {
    icon: 'fas fa-rotate-right',
    textKey: 'item_renewal_pending_review_text',
    excerptKey: 'item_renewal_pending_review_excerpt',
    href: () => '/admin#/adslot/renewals',
  },
  adslotItemRenewalReviewed: {
    icon: 'fas fa-clipboard-check',
    textKey: 'item_renewal_reviewed_text',
    excerptKey: 'item_renewal_reviewed_excerpt',
    href: () => app.route('adslotMy'),
  },
  adslotItemExpiring: {
    icon: 'fas fa-clock',
    textKey: 'item_expiring_text',
    excerptKey: 'item_expiring_excerpt',
    href: () => app.route('adslotMy'),
  },
  adslotItemExpired: {
    icon: 'fas fa-calendar-xmark',
    textKey: 'item_expired_text',
    excerptKey: 'item_expired_excerpt',
    href: () => app.route('adslotMy'),
  },
  adslotDiscountCodeUsed: {
    icon: 'fas fa-ticket-alt',
    textKey: 'discount_code_used_text',
    excerptKey: 'discount_code_used_excerpt',
    href: () => app.route('adslotMy'),
  },
};

export default class AdSlotBusinessNotification extends Notification {
  icon() {
    return this.meta().icon;
  }

  href() {
    try {
      return this.meta().href();
    } catch (e) {
      return '/providers/my';
    }
  }

  content() {
    return app.translator.trans(`doingfb-adslot.forum.notifications.${this.meta().textKey}`, this.translationParams());
  }

  excerpt() {
    if (['adslotItemPendingReview', 'adslotItemRenewalPendingReview'].includes(this.notificationType())) {
      const applicant = this.applicantLink();

      return app.translator.trans(`doingfb-adslot.forum.notifications.${this.meta().excerptKey}`, {
        ...this.translationParams(),
        applicant,
        '{applicant}': applicant,
      });
    }

    return app.translator.trans(`doingfb-adslot.forum.notifications.${this.meta().excerptKey}`, this.translationParams());
  }

  meta() {
    return NOTIFICATION_META[this.notificationType()] || NOTIFICATION_META.adslotItemExpiring;
  }

  translationParams() {
    const payload = this.payload();

    const params = {
      merchant: payload.merchantName || app.translator.trans('doingfb-adslot.forum.notifications.unknown_merchant'),
      days: payload.days || 3,
      code: payload.code || '-',
      amount: this.formatMoney(payload.amount),
      payableAmount: this.formatMoney(payload.payableAmount),
      durationMonths: Number(payload.durationMonths || 0),
      status: app.translator.trans(`doingfb-adslot.forum.notifications.status_${payload.status || 'pending'}`),
      endsAt: this.formatDate(payload.endsAt),
      oldEndsAt: this.formatDate(payload.oldEndsAt),
      newEndsAt: this.formatDate(payload.newEndsAt),
    };

    return {
      ...params,
      '{merchant}': params.merchant,
      '{days}': params.days,
      '{code}': params.code,
      '{amount}': params.amount,
      '{payableAmount}': params.payableAmount,
      '{durationMonths}': params.durationMonths,
      '{status}': params.status,
      '{endsAt}': params.endsAt,
      '{oldEndsAt}': params.oldEndsAt,
      '{newEndsAt}': params.newEndsAt,
    };
  }

  notificationType() {
    const notification = this.attrs.notification;

    return typeof notification.contentType === 'function'
      ? notification.contentType()
      : notification.attribute?.('contentType') || notification.data?.attributes?.contentType;
  }

  payload() {
    const notification = this.attrs.notification;

    if (typeof notification.content === 'function') {
      return notification.content() || {};
    }

    return notification.attribute?.('content') || notification.data?.attributes?.content || {};
  }

  fromUser() {
    const notification = this.attrs.notification;

    return typeof notification.fromUser === 'function' ? notification.fromUser() : null;
  }

  applicantLink() {
    const user = this.fromUser();
    const payload = this.payload();
    const label = this.applicantName(user, payload);
    const href = this.userHref(user, payload);

    if (!href) {
      return label;
    }

    const openProfile = (event) => {
      event.preventDefault();
      event.stopPropagation();
      m.route.set(href);
    };

    return (
      <span
        className="AdSlotNotificationUserLink"
        role="link"
        tabindex="0"
        title={label}
        onclick={openProfile}
        onkeydown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            openProfile(event);
          }
        }}
      >
        {label}
      </span>
    );
  }

  applicantName(user, payload) {
    if (user) {
      const username = this.userValue(user, 'username');
      const displayName = this.userValue(user, 'displayName');

      if (displayName || username) {
        return username || displayName;
      }
    }

    return (
      payload.applicantUsername ||
      payload.applicantDisplayName ||
      payload.applicantName ||
      app.translator.trans('doingfb-adslot.forum.notifications.unknown_applicant')
    );
  }

  userHref(user, payload) {
    if (user) {
      try {
        return app.route.user(user);
      } catch (e) {
        const username = this.userValue(user, 'username');

        if (username) {
          return `/u/${encodeURIComponent(username)}`;
        }
      }
    }

    if (payload.applicantUsername) {
      return `/u/${encodeURIComponent(payload.applicantUsername)}`;
    }

    return null;
  }

  userValue(user, key) {
    if (!user) {
      return null;
    }

    if (typeof user[key] === 'function') {
      return user[key]();
    }

    if (typeof user.attribute === 'function') {
      return user.attribute(key);
    }

    return user[key] || user.data?.attributes?.[key] || null;
  }

  formatMoney(value) {
    const number = Number(value || 0);

    return Number.isNaN(number) ? '0.00' : number.toFixed(2);
  }

  formatDate(value) {
    if (!value) {
      return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value).replace('T', ' ').slice(0, 16);
    }

    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
      .format(date)
      .replace(/\//g, '-');
  }
}
