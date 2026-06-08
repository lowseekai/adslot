import app from 'flarum/admin/app';
import ItemsPage from './components/ItemsPage';

app.initializers.add('doingfb-adslot', () => {
  app.extensionData.for('doingfb-adslot').registerPage(ItemsPage);
});
