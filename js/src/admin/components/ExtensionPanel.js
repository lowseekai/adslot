import app from 'flarum/admin/app';
import ExtensionPage from 'flarum/admin/components/ExtensionPage';
import Button from 'flarum/common/components/Button';
import LinkButton from 'flarum/common/components/LinkButton';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
import EditItemModal from './EditItemModal';
import ReviewTable from './ReviewTable';

export default class ExtensionPanel extends ExtensionPage {
  redrawNow() {
    if (typeof m === 'undefined' || typeof m.redraw !== 'function') {
      return;
    }

    if (this._redrawQueued) {
      return;
    }

    this._redrawQueued = true;

    const flush = () => {
      this._redrawQueued = false;
      if (typeof m.redraw.sync === 'function') {
        m.redraw.sync();
        return;
      }

      m.redraw();
    };

    // requestAnimationFrame can stall indefinitely for background tabs.
    setTimeout(flush, 0);
  }

  oninit(vnode) {
    super.oninit(vnode);

    this.recentLoading = true;
    this.configLoading = true;
    this.configSaving = false;
    this.configSavingModule = '';
    this.configSectionExpanded = {
      notice: false,
    };
    this.items = [];
    this.pendingTotal = 0;
    this.reviewFilterStatus = '';
    this.reviewFilterExpiry = '';
    this.reviewFilterMerchant = '';
    this.meta = {
      total: 0,
      hasMore: false,
    };
    this.error = null;
    this.configError = '';
    this.configNotice = '';
    this.config = {
      baseMonthlyFee: '',
      noticeBarEnabled: true,
      noticeBarText: '欢迎来到商家合作中心。',
      groups: [],
    };

    if (typeof window !== 'undefined') {
      window.__adslotAdminPanel = this;
    }
  }

  oncreate(vnode) {
    super.oncreate?.(vnode);

    if (this._bootstrapped) {
      return;
    }

    this._bootstrapped = true;

    const bootstrap = () => {
      if (this._isRemoved) {
        return;
      }

      this.loadRecentItems();
      this.loadConfig();
    };

    // Run bootstrap even when the admin tab opens in the background.
    setTimeout(bootstrap, 0);
  }

  onremove(vnode) {
    super.onremove?.(vnode);
    this._isRemoved = true;
  }

  content() {
    return (
      <div className="AdSlotAdminPage">
        <div className="AdSlotAdminPage-shell">
          <div className="AdSlotAdminCard">
            <div className="AdSlotAdminCard-head">
              <div><h3>广告位设置</h3><p>设置广告位每月积分价格和前台公告。</p></div>
              <div className="AdSlotAdminCard-headActions">
                <LinkButton className="Button AdSlotAdminGhostButton" href={app.route('adslotRenewals')} icon="fas fa-rotate-right">续费审核</LinkButton>
              </div>
            </div>
            <div className="AdSlotAdminConfigSections">
              <section className="AdSlotAdminConfigSection">
                <div className="AdSlotAdminConfigSection-head">
                  <div><h4>积分价格</h4><p>广告位按月收取积分。</p></div>
                  {Button.component({ type: 'button', className: 'Button Button--primary AdSlotAdminPrimaryButton', loading: this.configSavingModule === 'fees', onclick: () => this.saveFeesConfig(), disabled: this.configLoading || this.configSaving }, '保存价格')}
                </div>
                <div className="AdSlotAdminToolbar AdSlotAdminToolbar--config">
                  <label className="AdSlotAdminField"><span>每月积分</span>
                    <input className="FormControl" type="number" min="0" step="1" value={this.config.baseMonthlyFee} oninput={(event) => (this.config.baseMonthlyFee = event.target.value)} disabled={this.configLoading || this.configSaving} />
                  </label>
                </div>
              </section>
              <section className={`AdSlotAdminConfigSection${this.isConfigSectionExpanded('notice') ? ' is-expanded' : ' is-collapsed'}`}>
                <div className="AdSlotAdminConfigSection-head">
                  <div><h4>前台公告</h4><p>控制商家合作页面显示的公告。</p></div>
                  <div className="AdSlotAdminConfigSection-headActions">
                    {Button.component({ type: 'button', className: 'Button AdSlotAdminGhostButton', icon: this.isConfigSectionExpanded('notice') ? 'fas fa-chevron-up' : 'fas fa-chevron-down', onclick: () => this.toggleConfigSection('notice'), disabled: this.configLoading || this.configSaving }, this.isConfigSectionExpanded('notice') ? '收起' : '展开')}
                    {this.isConfigSectionExpanded('notice') ? Button.component({ type: 'button', className: 'Button Button--primary AdSlotAdminPrimaryButton', loading: this.configSavingModule === 'notice', onclick: () => this.saveNoticeConfig(), disabled: this.configLoading || this.configSaving }, '保存公告') : null}
                  </div>
                </div>
                {this.isConfigSectionExpanded('notice') ? (
                  <div className="AdSlotAdminNoticeConfig">
                    <label className="checkbox AdSlotAdminNoticeToggle"><input type="checkbox" checked={this.config.noticeBarEnabled} onchange={(event) => (this.config.noticeBarEnabled = event.target.checked)} disabled={this.configLoading || this.configSaving} /> 启用公告</label>
                    <label className="AdSlotAdminField AdSlotAdminField--noticeText"><span>公告内容</span>
                      <textarea className="FormControl" maxlength="2000" rows="4" value={this.config.noticeBarText} oninput={(event) => (this.config.noticeBarText = event.target.value)} disabled={this.configLoading || this.configSaving} placeholder="请输入前台公告"></textarea>
                    </label>
                  </div>
                ) : null}
              </section>
            </div>
            {this.configLoading ? <div className="AdSlotAdminPage-notice"><LoadingIndicator display="inline" size="small" /> 正在加载配置...</div> : null}
            {this.configError ? <div className="AdSlotAdminPage-error">{this.configError}</div> : null}
          </div>
        </div>

        <div className="AdSlotAdminPage-shell">
          <div className="AdSlotAdminCard AdSlotAdminCard--table">
            <div className="AdSlotAdminCard-head">
              <div>
                <h3>广告审核</h3>
                <p>首页展示最近 10 条商家数据，减少后台首页信息拥挤；完整审核列表进入更多页面处理。</p>
              </div>
              <div className="AdSlotAdminCard-headActions">
                {this.renderReviewFilters()}
                <LinkButton className="Button AdSlotAdminGhostButton" href={app.route('adslotReviews')} icon="fas fa-table-list">
                  查看全部审核
                </LinkButton>
              </div>
            </div>

            {this.error ? <div className="AdSlotAdminPage-error">{this.error}</div> : null}
            {this.recentLoading ? (
              <div className="AdSlotAdminPage-notice">
                <LoadingIndicator display="inline" size="small" /> 正在加载最近审核数据...
              </div>
            ) : null}

            <ReviewTable
              items={this.filteredReviewItems()}
              emptyText={this.hasReviewFilters() ? '当前筛选条件下暂无商家审核数据' : '最近暂无商家审核数据'}
              formatMoney={(value) => this.formatMoney(value)}
              formatDate={(value) => this.formatDate(value)}
              renderStatusBadge={(status) => this.renderStatusBadge(status)}
              renderVisibleBadge={(isVisible) => this.renderVisibleBadge(isVisible)}
              onEdit={(item) => this.openEditModal(item)}
              onApprove={(item) => this.quickUpdate(item.id, { status: 'approved', isVisible: true })}
              onReject={(item) => this.quickUpdate(item.id, { status: 'rejected', isVisible: false })}
              onTogglePinned={(item) => this.togglePinned(item)}
              onToggleVisible={(item) => this.toggleVisible(item)}
              onDelete={(item) => this.deleteItem(item.id)}
            />

            {this.meta.hasMore ? (
              <div className="AdSlotAdminTableFooter">
                <div className="AdSlotAdminTableFooter-copy">当前仅显示最近 10 条，完整审核数据共 {this.meta.total} 条。</div>
                <LinkButton className="Button Button--primary AdSlotAdminPrimaryButton" href={app.route('adslotReviews')}>
                  去更多页面分页查看
                </LinkButton>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    );
  }

  renderReviewFilters() {
    return (
      <div className="AdSlotAdminToolbar AdSlotAdminToolbar--reviewFilters">
        <label className="AdSlotAdminField">
          <span>状态</span>
          <select className="FormControl" value={this.reviewFilterStatus} onchange={(event) => (this.reviewFilterStatus = event.target.value)}>
            <option value="">全部</option>
            <option value="pending">待审核</option>
            <option value="approved">已通过</option>
            <option value="rejected">已驳回</option>
          </select>
        </label>

        <label className="AdSlotAdminField">
          <span>到期时间</span>
          <select className="FormControl" value={this.reviewFilterExpiry} onchange={(event) => (this.reviewFilterExpiry = event.target.value)}>
            <option value="">全部</option>
            <option value="active">未到期</option>
            <option value="expiring7">7 天内到期</option>
            <option value="expired">已到期</option>
            <option value="none">长期</option>
          </select>
        </label>

        <label className="AdSlotAdminField AdSlotAdminField--search">
          <span>商家名称</span>
          <input
            className="FormControl"
            value={this.reviewFilterMerchant}
            oninput={(event) => (this.reviewFilterMerchant = event.target.value)}
            placeholder="输入商家名称"
          />
        </label>
      </div>
    );
  }

  isConfigSectionExpanded(section) {
    return !!this.configSectionExpanded?.[section];
  }

  toggleConfigSection(section) {
    this.configSectionExpanded = {
      ...this.configSectionExpanded,
      [section]: !this.isConfigSectionExpanded(section),
    };
  }

  hasReviewFilters() {
    return !!(this.reviewFilterStatus || this.reviewFilterExpiry || this.reviewFilterMerchant.trim());
  }

  filteredReviewItems() {
    const keyword = this.reviewFilterMerchant.trim().toLowerCase();
    const now = Date.now();
    const sevenDays = 7 * 24 * 60 * 60 * 1000;

    return (this.items || []).filter((item) => {
      const attrs = item.attributes || {};

      if (this.reviewFilterStatus && attrs.status !== this.reviewFilterStatus) {
        return false;
      }

      if (keyword && !String(attrs.merchantName || '').toLowerCase().includes(keyword)) {
        return false;
      }

      if (!this.reviewFilterExpiry) {
        return true;
      }

      const endsAt = attrs.endsAt || attrs.expiresAt || '';

      if (this.reviewFilterExpiry === 'none') {
        return !endsAt;
      }

      if (!endsAt) {
        return false;
      }

      const timestamp = new Date(endsAt).getTime();

      if (Number.isNaN(timestamp)) {
        return false;
      }

      if (this.reviewFilterExpiry === 'expired') {
        return timestamp < now;
      }

      if (this.reviewFilterExpiry === 'expiring7') {
        return timestamp >= now && timestamp <= now + sevenDays;
      }

      return timestamp >= now;
    });
  }

  async loadRecentItems() {
    this.recentLoading = true;
    this.error = null;
    this.redrawNow();

    try {
      const [response, pendingResponse] = await Promise.all([
        app.request({
          method: 'GET',
          url: `${this.apiUrl()}/adslot/admin/items`,
          params: {
            summary: true,
            limit: 10,
          },
        }),
        app.request({
          method: 'GET',
          url: `${this.apiUrl()}/adslot/admin/items`,
          params: {
            status: 'pending',
            summary: true,
            limit: 1,
          },
        }),
      ]);
      this.items = response.data || [];
      this.meta = response.meta || { total: this.items.length, hasMore: false };
      this.pendingTotal = Number(pendingResponse?.meta?.total ?? pendingResponse?.data?.length ?? 0);
    } catch (error) {
      this.error = error.message || '加载失败';
    }

    this.recentLoading = false;
    this.redrawNow();
  }

  async loadConfig() {
    this.configLoading = true;
    this.configError = '';
    this.configNotice = '';
    this.redrawNow();

    try {
      const response = await app.request({
        method: 'GET',
        url: `${this.apiUrl()}/adslot/admin/config`,
      });
      const data = response.data || {};
      this.config = {
        baseMonthlyFee: String(data.baseMonthlyFee ?? ''),
        noticeBarEnabled: data.noticeBarEnabled !== false,
        noticeBarText: String(data.noticeBarText || '欢迎来到商家合作中心。'),
        groups: data.groups || [],
      };
    } catch (error) {
      this.configError = error.message || '配置加载失败';
    }

    this.configLoading = false;
    this.redrawNow();
  }

  saveFeesConfig() {
    return this.saveConfig(
      { baseMonthlyFee: Math.max(0, Math.round(Number(this.config.baseMonthlyFee || 0))) },
      '价格设置已保存。',
      'fees'
    );
  }

  saveNoticeConfig() {
    return this.saveConfig(
      {
        noticeBarEnabled: !!this.config.noticeBarEnabled,
        noticeBarText: this.config.noticeBarText || '欢迎来到商家合作中心。',
      },
      '公告栏设置已保存。',
      'notice'
    );
  }

  async saveConfig(attributes, successMessage, module) {
    this.configSaving = true;
    this.configSavingModule = module;
    this.configError = '';
    this.configNotice = '';
    this.redrawNow();

    try {
      const response = await app.request({
        method: 'POST',
        url: `${this.apiUrl()}/adslot/admin/config`,
        body: { data: { attributes } },
      });
      const data = response.data || {};
      this.config.baseMonthlyFee = String(data.baseMonthlyFee ?? this.config.baseMonthlyFee);
      this.config.noticeBarEnabled = data.noticeBarEnabled !== false;
      this.config.noticeBarText = String(data.noticeBarText || this.config.noticeBarText);
      this.configNotice = successMessage;
      app.alerts.show({ type: 'success' }, successMessage);
    } catch (error) {
      this.configError = error?.response?.errors?.[0]?.detail || error?.message || '保存失败';
    } finally {
      this.configSaving = false;
      this.configSavingModule = '';
      this.redrawNow();
    }
  }

  openEditModal(item) {
    app.modal.show(EditItemModal, {
      item,
      onsaved: () => this.loadRecentItems(),
    });
  }

  async quickUpdate(id, attributes) {
    try {
      await app.request({ method: 'POST', url: `${this.apiUrl()}/adslot/admin/items/update`, body: { data: { id, attributes } } });
      await this.loadRecentItems();
      app.alerts.show({ type: 'success' }, '广告状态已更新。');
    } catch (error) {
      this.error = error?.response?.errors?.[0]?.detail || error?.message || '操作失败';
      this.redrawNow();
    }
  }

  async toggleVisible(item) {
    await this.quickUpdate(item.id, {
      isVisible: !item.attributes?.isVisible,
    });
  }

  async togglePinned(item) {
    await this.quickUpdate(item.id, {
      isPinned: !item.attributes?.isPinned,
    });
  }

  async deleteItem(id) {
    if (!confirm('确认删除这条商家记录吗？')) {
      return;
    }

    try {
      await app.request({ method: 'POST', url: `${this.apiUrl()}/adslot/admin/items/delete`, body: { data: { id } } });
      await this.loadRecentItems();
      app.alerts.show({ type: 'success' }, '广告已删除。');
    } catch (error) {
      this.error = error?.response?.errors?.[0]?.detail || error?.message || '删除失败';
      this.redrawNow();
    }
  }

  formatDate(value) {
    if (!value) {
      return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value).replace('T', ' ').slice(0, 16);
    }

    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
      .format(date)
      .replace(/\//g, '-');
  }

  formatMoney(value) {
    return `${Number(value || 0).toFixed(2)} 元`;
  }

  renderStatusBadge(status) {
    const labelMap = {
      pending: '待审核',
      approved: '已通过',
      rejected: '已驳回',
    };

    return <span className={`AdSlotBadge is-${status || 'pending'}`}>{labelMap[status] || status || '-'}</span>;
  }

  renderVisibleBadge(isVisible) {
    return <span className={`AdSlotBadge ${isVisible ? 'is-visible' : 'is-hidden'}`}>{isVisible ? '显示中' : '隐藏中'}</span>;
  }


  apiUrl() {
    return (app.forum && app.forum.attribute('apiUrl')) || app.data?.apiUrl || '';
  }
}


