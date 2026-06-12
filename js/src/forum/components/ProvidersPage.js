import app from 'flarum/forum/app';
import Button from 'flarum/common/components/Button';
import LinkButton from 'flarum/common/components/LinkButton';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
import Page from 'flarum/common/components/Page';
import ApplyModal from './ApplyModal';

const OPEN_APPLY_MODAL_KEY = 'doingfb-adslot.open-apply-modal';
const APPLY_ROUTE_PATH = '/providers/apply';
const DEFAULT_NOTICE_TEXT = '活动即将到来';

export default class ProvidersPage extends Page {
  oninit(vnode) {
    super.oninit(vnode);

    this.loading = true;
    this.openingApply = false;
    this.items = [];
    this.error = '';
    this.lastApplyRouteAutoOpenKey = null;
    this.runtimeConfig = null;
    this.runtimeConfigPromise = null;

    this.loadItems();
    this.runtimeConfigPromise = this.loadRuntimeConfig().finally(() => {
      this.runtimeConfigPromise = null;
    });
  }

  oncreate(vnode) {
    super.oncreate(vnode);
    this.openApplyModalFromRedirect();
    this.openApplyModalFromRoute();
  }

  onupdate(vnode) {
    super.onupdate(vnode);
    this.openApplyModalFromRoute();
  }

  openApplyModal(attrs = {}) {
    if (this.openingApply) {
      return Promise.resolve(this.runtimeConfig);
    }

    this.openingApply = true;

    const runtimeConfigPromise =
      attrs.runtimeConfigPromise ||
      this.runtimeConfigPromise ||
      this.loadRuntimeConfig().finally(() => {
        this.runtimeConfigPromise = null;
      });
    this.runtimeConfigPromise = runtimeConfigPromise;

    app.modal.show(ApplyModal, {
      ...attrs,
      runtimeConfig: attrs.runtimeConfig || this.runtimeConfig,
      runtimeConfigPromise,
    });

    m.redraw();

    return runtimeConfigPromise.finally(() => {
      this.openingApply = false;
      m.redraw();
    });
  }

  openApplyModalFromRedirect() {
    const marker = window.localStorage?.getItem(OPEN_APPLY_MODAL_KEY);

    if (!marker) {
      return;
    }

    window.localStorage.removeItem(OPEN_APPLY_MODAL_KEY);
    this.openApplyModal();
  }

  openApplyModalFromRoute() {
    const currentRoute = m.route.get() || '';

    if (!currentRoute.startsWith(APPLY_ROUTE_PATH)) {
      this.lastApplyRouteAutoOpenKey = null;
      return;
    }

    const routeKey = `${currentRoute}::${window.location.search}`;

    if (this.lastApplyRouteAutoOpenKey === routeKey) {
      return;
    }

    this.lastApplyRouteAutoOpenKey = routeKey;

    this.openApplyModal({
      onclose: () => this.normalizeApplyRoute(),
    });
    this.normalizeApplyRoute();
  }

  normalizeApplyRoute() {
    const currentRoute = m.route.get() || '';

    if (!currentRoute.startsWith(APPLY_ROUTE_PATH)) {
      return;
    }

    requestAnimationFrame(() => {
      const latestRoute = m.route.get() || '';

      if (!latestRoute.startsWith(APPLY_ROUTE_PATH)) {
        return;
      }

      m.route.set(app.route('adslotProviders'), undefined, { replace: true });
    });
  }

  view() {
    return (
      <div className="AdSlotProvidersPage">
        {this.renderNoticeBar()}

        <div className="container" style={{ marginTop: '20px' }}>
          <div className="AdSlotHero">
            <div>
              <h1>商家合作</h1>
              <p>这里只展示已审核通过的商家广告图，按页面宽度自动计算每行广告位数量。</p>
            </div>
            <div className="AdSlotHero-actions">
              {LinkButton.component(
                {
                  className: 'Button',
                  href: app.route('adslotMy'),
                  icon: 'fas fa-rectangle-ad',
                },
                '我的广告'
              )}
              {Button.component(
                {
                  className: 'Button Button--primary',
                  icon: 'fas fa-plus',
                  onclick: () => this.openApplyModal(),
                  loading: this.openingApply,
                },
                '申请展示'
              )}
            </div>
          </div>

          {this.loading ? <LoadingIndicator display="block" /> : null}
          {this.error ? <div className="AdSlotNotice is-error">{this.error}</div> : null}

          {this.items.length ? (
            <div className="AdSlotGrid">
              {this.items.map((item) => this.renderItem(item))}
            </div>
          ) : this.loading ? null : (
            <div className="AdSlotGrid AdSlotGrid--empty">
              <div className="AdSlotEmpty">当前还没有可展示的商家内容。</div>
            </div>
          )}
        </div>
      </div>
    );
  }

  renderNoticeBar() {
    if (!this.isNoticeBarEnabled()) {
      return null;
    }

    return (
      <div className="ActHubNoticeBar">
        <div className="container">
          <div className="ActHubNoticeBar-inner">
            <i aria-hidden="true" className="icon fas fa-bullhorn ActHubNoticeBar-icon"></i>
            <div className="ActHubNoticeBar-body">{m.trust(this.noticeBarText())}</div>
          </div>
        </div>
      </div>
    );
  }

  isNoticeBarEnabled() {
    const value = this.runtimeConfig?.noticeBarEnabled ?? app.forum.attribute('doingfb-adslot.noticeBarEnabled');

    return value === true || value === 1 || value === '1' || value === 'true';
  }

  noticeBarText() {
    const text = this.runtimeConfig?.noticeBarText ?? app.forum.attribute('doingfb-adslot.noticeBarText') ?? DEFAULT_NOTICE_TEXT;

    return String(text).trim() || DEFAULT_NOTICE_TEXT;
  }

  renderItem(item) {
    const attrs = item.attributes || {};

    return (
      <a
        className="AdSlotCard"
        href={attrs.targetUrl}
        target="_blank"
        rel="noreferrer"
        key={item.id}
      >
        {attrs.isPinned ? <span className="AdSlotCard-badge">热门推荐</span> : null}
        <img src={attrs.imagePath} alt="logo" title={attrs.merchantName} />
      </a>
    );
  }

  loadItems() {
    this.loading = true;
    this.error = '';
    m.redraw();

    const apiUrl = app.forum?.attribute('apiUrl') || app.data?.apiUrl || '';

    return fetch(`${apiUrl}/adslot/public/items`, {
      credentials: 'same-origin',
      headers: {
        Accept: 'application/vnd.api+json',
      },
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Request failed with status ${response.status}`);
        }

        return response.json();
      })
      .then((payload) => {
        this.items = payload && payload.data ? payload.data : [];
      })
      .catch((error) => {
        this.items = [];
        this.error = error.message || '加载失败';
      })
      .finally(() => {
        this.loading = false;
        m.redraw();
      });
  }

  async loadRuntimeConfig() {
    try {
      const response = await app.request({
        method: 'GET',
        url: `${app.forum.attribute('apiUrl')}/adslot/forum/config`,
        params: {
          _t: Date.now(),
        },
      });

      this.runtimeConfig = response?.data || null;
      m.redraw();
      return this.runtimeConfig;
    } catch (_error) {
      return null;
    }
  }

  formatDuration(value) {
    const months = Number(value || 0);

    return months > 0 ? `${months} 涓湀` : '';
  }

  contactTypeLabel(value) {
    if (value === 'telegram') {
      return 'Telegram';
    }

    if (value === 'email') {
      return '閭';
    }

    return '寰俊';
  }
}
