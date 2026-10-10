const app = flarum.core.app;
const IndexSidebar = flarum.reg.get('core', 'forum/components/IndexSidebar');
const extend = flarum.reg.get('core', 'common/extend');
const LinkButton = flarum.reg.get('core', 'common/components/LinkButton');
const Modal = flarum.reg.get('core', 'common/components/Modal');

class ApplyModal extends Modal {
  oninit(vnode) { super.oninit(vnode); this.form = { merchantName: '', imagePath: '', targetUrl: '', contactValue: '', durationMonths: 1 }; this.busy = false; this.error = ''; }
  view() {
    const field = (label, key, type = 'text') => m('.Form-group', [m('label', label), m('input.FormControl', { required: true, type, value: this.form[key], oninput: (e) => { this.form[key] = e.target.value; } })]);
    return m('.Modal.modal-dialog', m('.Modal-content', [m('.Modal-header', m('h3', 'AdSlot application')), m('.Modal-body', m('form.Form', { onsubmit: (e) => this.submit(e) }, [field('Merchant name', 'merchantName'), field('Image URL', 'imagePath', 'url'), field('Target URL', 'targetUrl', 'url'), field('Contact', 'contactValue'), m('.Form-group', [m('label', 'Duration'), m('select.FormControl', { value: this.form.durationMonths, onchange: (e) => { this.form.durationMonths = Number(e.target.value); } }, [1, 3, 6, 12].map((n) => m('option', { value: n }, `${n} month(s)`)))]), this.error ? m('.Alert.Alert--error', this.error) : null, m('.Form-group', [m('button.Button', { type: 'button', onclick: () => app.modal.close() }, 'Cancel'), m('button.Button.Button--primary', { type: 'submit', disabled: this.busy }, this.busy ? 'Submitting...' : 'Submit application')])]))]));
  }
  async submit(event) { event.preventDefault(); this.busy = true; try { await app.request({ method: 'POST', url: `${app.forum.attribute('apiUrl')}/adslot/items`, body: { data: { attributes: this.form } } }); app.modal.close(); app.alerts.show({ type: 'success' }, 'Application submitted for review.'); } catch (e) { this.error = e?.response?.errors?.[0]?.detail || e.message || 'Submission failed'; } finally { this.busy = false; m.redraw(); } }
}

class ProvidersPage {
  oninit() { this.loading = true; this.items = []; this.error = ''; app.request({ method: 'GET', url: `${app.forum.attribute('apiUrl')}/adslot/public/items` }).then((p) => { this.items = p.data || []; }).catch((e) => { this.error = e.message || 'Loading failed'; }).finally(() => { this.loading = false; m.redraw(); }); }
  view() { return m('.AdSlotProvidersPage', m('.container', [m('.AdSlotHero', [m('h1', 'Merchant advertising'), m('p', 'Approved advertisements.'), m('.AdSlotHero-actions', [LinkButton.component({ href: app.route('adslotMy'), icon: 'fas fa-rectangle-ad' }, 'My ads'), m('button.Button.Button--primary', { onclick: () => app.modal.show(ApplyModal) }, 'Apply for an ad slot')])]), this.loading ? m('.LoadingIndicator', 'Loading...') : null, this.error ? m('.Alert', this.error) : null, this.items.length ? m('.AdSlotGrid', this.items.map((item) => { const a = item.attributes || {}; return m('a.AdSlotCard', { href: a.targetUrl, target: '_blank', rel: 'noreferrer' }, m('img', { src: a.imagePath, alt: a.merchantName || 'Ad' })); })) : (this.loading ? null : m('.AdSlotEmpty', 'No approved advertisements yet.'))])); }
}
class MyAdsPage { view() { return m('.container', [m('h1', 'My ads'), m('p', 'Sign in to view your applications.')]); } }
class ApplyPage { view() { return m('.container', [m('h1', 'Apply for an ad slot'), m('button.Button.Button--primary', { onclick: () => { m.route.set(app.route('adslotProviders')); setTimeout(() => app.modal.show(ApplyModal), 0); } }, 'Open application form')]); } }

app.initializers.add('doingfb-adslot', () => {
  app.routes.adslotProviders = { path: '/providers', component: ProvidersPage };
  app.routes.adslotMy = { path: '/providers/my', component: MyAdsPage };
  app.routes.adslotApply = { path: '/providers/apply', component: ApplyPage };
  if (IndexSidebar && extend) extend(IndexSidebar.prototype, 'navItems', (items) => items.add('doingfb-adslot', LinkButton.component({ href: app.route('adslotProviders'), icon: 'fas fa-rectangle-ad' }, 'Merchant ads'), 90));
});
