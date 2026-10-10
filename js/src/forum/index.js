import app from 'flarum/forum/app';
import IndexSidebar from 'flarum/forum/components/IndexSidebar';
import { extend } from 'flarum/common/extend';
import LinkButton from 'flarum/common/components/LinkButton';
import ProvidersPage from './components/ProvidersPage';
import MyAdsPage from './components/MyAdsPage';
import ApplyPage from './components/ApplyPage';

app.initializers.add('doingfb-adslot', () => {
  app.routes.adslotProviders = { path: '/providers', component: ProvidersPage };
  app.routes.adslotMy = { path: '/providers/my', component: MyAdsPage };
  app.routes.adslotApply = { path: '/providers/apply', component: ApplyPage };
  extend(IndexSidebar.prototype, 'navItems', (items) =>
    items.add(
      'adslot-providers',
      <LinkButton href={app.route('adslotProviders')} icon="fas fa-rectangle-ad">
        商家广告
      </LinkButton>,
      90
    )
  );
});
