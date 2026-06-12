import app from 'flarum/forum/app';
import Button from 'flarum/common/components/Button';
import LinkButton from 'flarum/common/components/LinkButton';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
import Page from 'flarum/common/components/Page';
import LogInModal from 'flarum/forum/components/LogInModal';
import ApplyModal from './ApplyModal';

const STATUS_LABELS = {
  pending: '待审核',
  approved: '已通过',
  rejected: '已驳回',
  renewing: '续费中',
};

export default class MyAdsPage extends Page {
  oninit(vnode) {
    super.oninit(vnode);

    this.loading = false;
    this.openingApply = false;
    this.items = [];
    this.error = '';
    this.runtimeConfig = null;
    this.runtimeConfigPromise = null;
    this.activeUserId = this.currentUserId();
    this.currentLoadToken = 0;

    if (this.activeUserId) {
      this.loadItems();
      this.runtimeConfigPromise = this.loadRuntimeConfig().finally(() => {
        this.runtimeConfigPromise = null;
      });
    }
  }

  onbeforeupdate() {
    const userId = this.currentUserId();

    if (userId === this.activeUserId) {
      return true;
    }

    this.activeUserId = userId;
    this.currentLoadToken += 1;
    this.items = [];
    this.error = '';
    this.runtimeConfig = null;
    this.runtimeConfigPromise = null;

    if (userId) {
      this.loadItems();
      this.runtimeConfigPromise = this.loadRuntimeConfig().finally(() => {
        this.runtimeConfigPromise = null;
      });
    }

    return true;
  }

  view() {
    return (
      <div className="AdSlotMyPage">
        <div className="container">
          <div className="AdSlotMyHero">
            <div>
              <h1>我的广告</h1>
              <p>查看广告审核状态、展示时间和到期信息；需要续费时可从这里提交新的续费申请。</p>
            </div>
            <div className="AdSlotMyHero-actions">
              {LinkButton.component(
                {
                  className: 'Button',
                  href: app.route('adslotProviders'),
                  icon: 'fas fa-arrow-left',
                },
                '商家合作'
              )}
              {this.isAdminUser() ? (
                <a className="Button hasIcon" href="/admin#/adslot/reviews" onclick={(event) => this.openAdminReviews(event)}>
                  <i aria-hidden="true" className="icon fas fa-table-list Button-icon" />
                  <span className="Button-label">广告管理</span>
                </a>
              ) : null}
              {Button.component(
                {
                  className: 'Button Button--primary',
                  icon: 'fas fa-plus',
                  onclick: () => this.openApplyModal(),
                  loading: this.openingApply,
                  disabled: !app.session.user,
                },
                '申请展示'
              )}
            </div>
          </div>

          {!app.session.user ? this.renderGuestState() : this.renderContent()}
        </div>
      </div>
    );
  }

  renderGuestState() {
    return (
      <div className="AdSlotMyState">
        <h3>登录后查看你的广告</h3>
        <p>广告申请、审核结果和续费入口会绑定到提交账号。</p>
        {Button.component(
          {
            className: 'Button Button--primary',
            icon: 'fas fa-sign-in-alt',
            onclick: () => app.modal.show(LogInModal),
          },
          '登录'
        )}
      </div>
    );
  }

  renderContent() {
    if (this.error) {
      return <div className="AdSlotNotice is-error">{this.error}</div>;
    }

    if (!this.items.length) {
      return (
        <div className="AdSlotMyState">
          <h3>还没有广告申请</h3>
          <p>提交申请后，可以在这里查看审核进度和后续续费入口。</p>
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
      );
    }

    return <div className="AdSlotMyList">{this.items.map((item) => this.renderItem(item))}</div>;
  }

  renderItem(item) {
    const attrs = item.attributes || {};
    const status = this.effectiveStatus(attrs);
    const daysLeft = this.daysLeft(attrs.endsAt);
    const canRenew = status === 'approved' || status === 'expired';
    const canEdit = attrs.status === 'pending' || attrs.status === 'rejected';

    return (
      <div className={`AdSlotMyCard AdSlotMyCard--${status}`} key={item.id}>
        <div className="AdSlotMyCard-image">{attrs.imagePath ? <img src={attrs.imagePath} alt={attrs.merchantName || '广告图'} /> : null}</div>
        <div className="AdSlotMyCard-main">
          <div className="AdSlotMyCard-head">
            <div>
              <h3>{attrs.merchantName || '未命名商家'}</h3>
              <a href={attrs.targetUrl} target="_blank" rel="noreferrer">
                {attrs.targetUrl || '-'}
              </a>
            </div>
            <span className={`AdSlotMyStatus AdSlotMyStatus--${status}`}>{this.statusLabel(status)}</span>
          </div>

          <div className="AdSlotMyMeta">
            <span>开始时间：{this.formatDate(attrs.startsAt)}</span>
            <span>到期时间：{this.formatDate(attrs.endsAt)}</span>
            <span>剩余时间：{this.remainingText(status, daysLeft)}</span>
            <span>投放时长：{this.formatDuration(attrs.durationMonths)}</span>
            <span>应付金额：{this.formatMoney(attrs.payableAmount)}</span>
            <span>展示状态：{attrs.isVisible ? '展示中' : '未展示'}</span>
          </div>

          {attrs.pendingRenewal ? (
            <div className="AdSlotMyRenewalNote">
              续费申请已提交，等待管理员审核。续费时长：{this.formatDuration(attrs.pendingRenewal.durationMonths)}，本次应付：
              {this.formatMoney(attrs.pendingRenewal.payableAmount)}，提交时间：{this.formatDate(attrs.pendingRenewal.createdAt)}
            </div>
          ) : null}

          {attrs.reviewNote ? <div className="AdSlotMyReviewNote">审核备注：{attrs.reviewNote}</div> : null}

          <div className="AdSlotMyActions">
            {canEdit
              ? Button.component(
                  {
                    className: 'Button',
                    icon: 'fas fa-pen',
                    onclick: () => this.openApplyModal({ mode: 'edit', item }),
                  },
                  attrs.status === 'rejected' ? '修改后重新提交' : '修改申请'
                )
              : null}
            {canRenew
              ? Button.component(
                  {
                    className: daysLeft !== null && daysLeft <= 7 ? 'Button Button--primary' : 'Button',
                    icon: 'fas fa-rotate-right',
                    onclick: () => this.openApplyModal({ mode: 'renew', item }),
                  },
                  status === 'expired' ? '重新续费' : '续费'
                )
              : null}
          </div>
        </div>
      </div>
    );
  }

  openApplyModal(attrs = {}) {
    if (!app.session.user || this.openingApply) {
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
      onsubmitted: () => this.loadItems(),
    });

    m.redraw();

    return runtimeConfigPromise.finally(() => {
      this.openingApply = false;
      m.redraw();
    });
  }

  async loadItems() {
    const userId = this.currentUserId();

    if (!userId) {
      this.items = [];
      this.loading = false;
      this.error = '';
      return;
    }

    const loadToken = ++this.currentLoadToken;
    this.loading = true;
    this.error = '';
    m.redraw();

    const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
    const timeout = window.setTimeout(() => controller?.abort(), 10000);

    try {
      const response = await fetch(`${app.forum.attribute('apiUrl')}/adslot/me/items?_t=${Date.now()}`, {
        credentials: 'same-origin',
        headers: {
          Accept: 'application/vnd.api+json',
        },
        signal: controller?.signal,
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      const payload = await response.json();
      if (loadToken !== this.currentLoadToken || userId !== this.currentUserId()) {
        return;
      }

      this.items = payload && payload.data ? payload.data : [];
    } catch (error) {
      if (loadToken !== this.currentLoadToken || userId !== this.currentUserId()) {
        return;
      }

      this.items = [];

      if (error?.name === 'AbortError') {
        this.error = '加载超时，请刷新页面后重试。';
      } else {
        this.error = this.getErrorMessage(error);
      }
    } finally {
      window.clearTimeout(timeout);
      if (loadToken === this.currentLoadToken && userId === this.currentUserId()) {
        this.loading = false;
        m.redraw();
      }
    }
  }

  currentUserId() {
    const user = app.session.user;

    if (!user) {
      return '';
    }

    return String(typeof user.id === 'function' ? user.id() : user.id || '');
  }

  isAdminUser() {
    const user = app.session.user;

    return !!(user && typeof user.isAdmin === 'function' && user.isAdmin());
  }

  openAdminReviews(event) {
    event?.preventDefault();
    event?.stopPropagation();
    window.location.assign(`${window.location.origin}/admin#/adslot/reviews`);
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

  effectiveStatus(attrs) {
    if (attrs.hasPendingRenewal || attrs.pendingRenewal) {
      return 'renewing';
    }

    if (attrs.status === 'approved' && attrs.endsAt && this.daysLeft(attrs.endsAt) < 0) {
      return 'expired';
    }

    return attrs.status || 'pending';
  }

  statusLabel(status) {
    if (status === 'expired') {
      return '已过期';
    }

    return STATUS_LABELS[status] || status;
  }

  daysLeft(value) {
    if (!value) {
      return null;
    }

    const end = new Date(value);

    if (Number.isNaN(end.getTime())) {
      return null;
    }

    return Math.ceil((end.getTime() - Date.now()) / 86400000);
  }

  remainingText(status, daysLeft) {
    if (!['approved', 'expired', 'renewing'].includes(status)) {
      return '-';
    }

    if (daysLeft === null) {
      return '长期';
    }

    if (daysLeft < 0) {
      return `已过期 ${Math.abs(daysLeft)} 天`;
    }

    if (daysLeft === 0) {
      return '今天到期';
    }

    return `${daysLeft} 天`;
  }

  formatDate(value) {
    if (!value) {
      return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value).slice(0, 10);
    }

    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .format(date)
      .replace(/\//g, '-');
  }

  formatDuration(value) {
    const months = Number(value || 0);

    return months > 0 ? `${months} 个月` : '-';
  }

  formatMoney(value) {
    return `${Number(value || 0).toFixed(2)} 元`;
  }

  getErrorMessage(error) {
    return (
      error?.response?.errors?.[0]?.detail ||
      error?.response?.errors?.[0]?.message ||
      error?.responseText ||
      error?.message ||
      '加载失败，请稍后重试。'
    );
  }
}
