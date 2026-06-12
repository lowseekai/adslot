import app from 'flarum/forum/app';
import LinkButton from 'flarum/common/components/LinkButton';
import { extend, override } from 'flarum/common/extend';
import NotificationGrid from 'flarum/forum/components/NotificationGrid';
import NotificationList from 'flarum/forum/components/NotificationList';
import NotificationsDropdown from 'flarum/forum/components/NotificationsDropdown';
import IndexPage from 'flarum/forum/components/IndexPage';
import UserPage from 'flarum/forum/components/UserPage';
import AdSlotItem from '../common/models/AdSlotItem';
import AdSlotBusinessNotification from './components/AdSlotBusinessNotification';
import ItemReviewedNotification from './components/ItemReviewedNotification';
import ProvidersPage from './components/ProvidersPage';
import ApplyPage from './components/ApplyPage';
import MyAdsPage from './components/MyAdsPage';

app.initializers.add('doingfb-adslot', () => {
  app.routes.adslotProviders = { path: '/providers', component: ProvidersPage };
  app.routes.adslotMy = { path: '/providers/my', component: MyAdsPage };
  app.routes.adslotApply = { path: '/providers/apply', component: ApplyPage };
  app.store.models['adslot-items'] = AdSlotItem;
  app.notificationComponents.adslotItemReviewed = ItemReviewedNotification;
  app.notificationComponents.adslotItemPendingReview = AdSlotBusinessNotification;
  app.notificationComponents.adslotItemRenewalPendingReview = AdSlotBusinessNotification;
  app.notificationComponents.adslotItemRenewalReviewed = AdSlotBusinessNotification;
  app.notificationComponents.adslotItemExpiring = AdSlotBusinessNotification;
  app.notificationComponents.adslotItemExpired = AdSlotBusinessNotification;
  app.notificationComponents.adslotDiscountCodeUsed = AdSlotBusinessNotification;

  override(NotificationsDropdown.prototype, 'onclick', function (original, event) {
    if (event) {
      event.redraw = false;
    }

    let result;

    if (this.attrs.state === app.notifications && !app.drawer.isOpen()) {
      result = this.attrs.state.load();
      Promise.resolve(result).finally(() => m.redraw());
    } else {
      result = original(event);
    }

    if (this.attrs.state === app.notifications && !app.drawer.isOpen()) {
      const showMenu = () => {
        if (this.$()?.hasClass('open') || this.$('.Dropdown-toggle')?.attr('aria-expanded') === 'true') {
          this.showing = true;
          m.redraw.sync();
        }
      };

      setTimeout(showMenu, 0);
      setTimeout(showMenu, 80);
    }

    return result;
  });

  override(NotificationsDropdown.prototype, 'getMenu', function (original) {
    if (this.attrs.state !== app.notifications) {
      return original();
    }

    return (
      <div className={['Dropdown-menu', this.attrs.menuClassName].filter(Boolean).join(' ')} onclick={this.menuClick.bind(this)}>
        <NotificationList state={this.attrs.state} />
      </div>
    );
  });

  extend(IndexPage.prototype, 'navItems', function (items) {
    items.add(
      'adslot-providers',
      LinkButton.component(
        {
          className: 'AdSlotNavButton',
          href: app.route('adslotProviders'),
          icon: 'fas fa-rectangle-ad',
        },
        '商家合作'
      ),
      80
    );
  });

  extend(UserPage.prototype, 'navItems', function (items) {
    const pageUser = typeof this.user === 'function' ? this.user() : this.user;

    if (!app.session.user || !pageUser || String(pageUser.id()) !== String(app.session.user.id())) {
      return;
    }

    items.add(
      'adslot-my',
      LinkButton.component(
        {
          href: app.route('adslotMy'),
          icon: 'fas fa-rectangle-ad',
        },
        '我的广告'
      ),
      80
    );
  });

  extend(NotificationGrid.prototype, 'notificationTypes', function (items) {
    items.add('adslotItemReviewed', {
      name: 'adslotItemReviewed',
      icon: 'fas fa-clipboard-check',
      label: app.translator.trans('doingfb-adslot.forum.settings.notify_item_reviewed_label'),
    });
    items.add('adslotItemPendingReview', {
      name: 'adslotItemPendingReview',
      icon: 'fas fa-clipboard-list',
      label: app.translator.trans('doingfb-adslot.forum.settings.notify_item_pending_review_label'),
    });
    items.add('adslotItemRenewalPendingReview', {
      name: 'adslotItemRenewalPendingReview',
      icon: 'fas fa-rotate-right',
      label: app.translator.trans('doingfb-adslot.forum.settings.notify_item_renewal_pending_review_label'),
    });
    items.add('adslotItemRenewalReviewed', {
      name: 'adslotItemRenewalReviewed',
      icon: 'fas fa-clipboard-check',
      label: app.translator.trans('doingfb-adslot.forum.settings.notify_item_renewal_reviewed_label'),
    });
    items.add('adslotItemExpiring', {
      name: 'adslotItemExpiring',
      icon: 'fas fa-clock',
      label: app.translator.trans('doingfb-adslot.forum.settings.notify_item_expiring_label'),
    });
    items.add('adslotItemExpired', {
      name: 'adslotItemExpired',
      icon: 'fas fa-calendar-xmark',
      label: app.translator.trans('doingfb-adslot.forum.settings.notify_item_expired_label'),
    });
    items.add('adslotDiscountCodeUsed', {
      name: 'adslotDiscountCodeUsed',
      icon: 'fas fa-ticket-alt',
      label: app.translator.trans('doingfb-adslot.forum.settings.notify_discount_code_used_label'),
    });
  });
});
