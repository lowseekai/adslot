import app from 'flarum/forum/app';
import Notification from 'flarum/forum/components/Notification';

export default class ItemReviewedNotification extends Notification {
  icon() {
    const status = this.payload().status;

    if (status === 'approved') {
      return 'fas fa-circle-check';
    }

    if (status === 'rejected') {
      return 'fas fa-circle-xmark';
    }

    return 'fas fa-clipboard-check';
  }

  href() {
    try {
      return app.route('adslotProviders');
    } catch (e) {
      return '/providers';
    }
  }

  content() {
    const notification = this.attrs.notification;
    const user = typeof notification.fromUser === 'function' ? notification.fromUser() : null;
    const status = this.payload().status;

    if (status === 'approved') {
      return app.translator.trans('doingfb-adslot.forum.notifications.item_reviewed_approved_text', { user });
    }

    if (status === 'rejected') {
      return app.translator.trans('doingfb-adslot.forum.notifications.item_reviewed_rejected_text', { user });
    }

    return app.translator.trans('doingfb-adslot.forum.notifications.item_reviewed_pending_text', { user });
  }

  excerpt() {
    const payload = this.payload();
    const reviewNote = String(payload.reviewNote || '').trim();
    const grantGroupName = String(payload.grantGroupName || '').trim();

    if (reviewNote) {
      const excerpt = reviewNote.slice(0, 200);

      if (!grantGroupName) {
        return excerpt;
      }

      return app.translator.trans('doingfb-adslot.forum.notifications.review_note_with_grant', {
        reviewNote: excerpt,
        grantGroup: grantGroupName,
        '{reviewNote}': excerpt,
        '{grantGroup}': grantGroupName,
      });
    }

    const params = {
      status: app.translator.trans(`doingfb-adslot.forum.notifications.status_${payload.status || 'pending'}`),
      visibility: app.translator.trans(`doingfb-adslot.forum.notifications.visibility_${payload.isVisible ? 'visible' : 'hidden'}`),
    };
    const key = grantGroupName
      ? 'doingfb-adslot.forum.notifications.excerpt_fallback_with_grant'
      : 'doingfb-adslot.forum.notifications.excerpt_fallback';

    return app.translator.trans(key, {
      ...params,
      '{status}': params.status,
      '{visibility}': params.visibility,
      grantGroup: grantGroupName,
      '{grantGroup}': grantGroupName,
    });
  }

  payload() {
    const notification = this.attrs.notification;

    if (typeof notification.content === 'function') {
      return notification.content() || {};
    }

    return notification.attribute?.('content') || notification.data?.attributes?.content || {};
  }
}
