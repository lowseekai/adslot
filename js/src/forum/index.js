const app = flarum.core.app;

function apiUrl(path) {
  return `${app.forum.attribute('apiUrl')}${path}`;
}

class ProvidersPage {
  oninit() {
    this.loading = true;
    this.items = [];
    this.error = '';
    fetch(apiUrl('/adslot/public/items'), { credentials: 'same-origin', headers: { Accept: 'application/vnd.api+json' } })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error(`Request failed (${response.status})`)))
      .then((payload) => { this.items = payload.data || []; })
      .catch((error) => { this.error = error.message || '加载失败'; })
      .finally(() => { this.loading = false; m.redraw(); });
  }

  view() {
    return m('.AdSlotProvidersPage', m('.container', [
      m('.AdSlotHero', [m('h1', '商家合作'), m('p', '这里展示已审核通过的商家广告。')]),
      this.loading ? m('.LoadingIndicator', '正在加载…') : null,
      this.error ? m('.Alert', this.error) : null,
      m('.AdSlotGrid', this.items.length ? this.items.map((item) => {
        const attrs = item.attributes || {};
        return m('a.AdSlotCard', { href: attrs.targetUrl, target: '_blank', rel: 'noreferrer' }, m('img', { src: attrs.imagePath, alt: attrs.merchantName || '广告' }));
      }) : (this.loading ? null : m('.AdSlotEmpty', '当前还没有可展示的商家内容。'))),
    ]));
  }
}

class ApplyPage {
  view() { return m('.container', [m('h1', '申请展示'), m('p', '请登录后提交广告申请。')]); }
}

class MyAdsPage {
  view() { return m('.container', [m('h1', '我的广告'), m('p', '登录后查看你的广告申请。')]); }
}

app.initializers.add('doingfb-adslot', () => {
  app.routes.adslotProviders = { path: '/providers', component: () => Promise.resolve({ default: ProvidersPage }) };
  app.routes.adslotMy = { path: '/providers/my', component: () => Promise.resolve({ default: MyAdsPage }) };
  app.routes.adslotApply = { path: '/providers/apply', component: () => Promise.resolve({ default: ApplyPage }) };
});
