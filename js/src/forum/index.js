import app from 'flarum/forum/app';
import LinkButton from 'flarum/common/components/LinkButton';
import { extend } from 'flarum/common/extend';
import IndexPage from 'flarum/forum/components/IndexPage';
import ProvidersPage from './components/ProvidersPage';
import ApplyPage from './components/ApplyPage';

app.initializers.add('doingfb-adslot', () => {
  app.routes.adslotProviders = { path: '/providers', component: ProvidersPage };
  app.routes.adslotApply = { path: '/providers/apply', component: ApplyPage };

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
});
