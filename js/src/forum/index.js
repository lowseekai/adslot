const app = flarum.core.app;
const IndexSidebar = flarum.reg.get('core', 'forum/components/IndexSidebar');
const extend = flarum.reg.get('core', 'common/extend').extend;
const LinkButton = flarum.reg.get('core', 'common/components/LinkButton');
import ProvidersPage from './components/ProvidersPage';
import MyAdsPage from './components/MyAdsPage';
import ApplyPage from './components/ApplyPage';

app.initializers.add('doingfb-adslot', () => {
  app.routes.adslotProviders = { path: '/providers', component: ProvidersPage };
  app.routes.adslotMy = { path: '/providers/my', component: MyAdsPage };
  app.routes.adslotApply = { path: '/providers/apply', component: ApplyPage };
  if (IndexSidebar && extend) extend(IndexSidebar.prototype, 'navItems', (items) => items.add('doingfb-adslot', LinkButton.component({ href: '/providers', icon: 'fas fa-rectangle-ad' }, '商家广告'), 90));
});
