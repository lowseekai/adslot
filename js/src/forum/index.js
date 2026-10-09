import app from 'flarum/forum/app';
import AdSlotItem from '../common/models/AdSlotItem';
import ProvidersPage from './components/ProvidersPage';
import ApplyPage from './components/ApplyPage';
import MyAdsPage from './components/MyAdsPage';

app.initializers.add('doingfb-adslot', () => {
  app.routes.adslotProviders = { path: '/providers', component: ProvidersPage };
  app.routes.adslotMy = { path: '/providers/my', component: MyAdsPage };
  app.routes.adslotApply = { path: '/providers/apply', component: ApplyPage };
  app.store.models['adslot-items'] = AdSlotItem;
});
