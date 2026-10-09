import app from 'flarum/forum/app';
import LinkButton from 'flarum/common/components/LinkButton';
import { extend } from 'flarum/common/extend';
import IndexPage from 'flarum/forum/components/IndexPage';
import UserPage from 'flarum/forum/components/UserPage';
import AdSlotItem from '../common/models/AdSlotItem';
import ProvidersPage from './components/ProvidersPage';
import ApplyPage from './components/ApplyPage';
import MyAdsPage from './components/MyAdsPage';

app.initializers.add('doingfb-adslot', () => {
  app.routes.adslotProviders = { path: '/providers', component: ProvidersPage };
  app.routes.adslotMy = { path: '/providers/my', component: MyAdsPage };
  app.routes.adslotApply = { path: '/providers/apply', component: ApplyPage };
  app.store.models['adslot-items'] = AdSlotItem;

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

});
