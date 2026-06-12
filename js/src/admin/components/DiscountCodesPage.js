import app from 'flarum/admin/app';
import AdminPage from 'flarum/admin/components/AdminPage';
import Button from 'flarum/common/components/Button';
import LinkButton from 'flarum/common/components/LinkButton';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';

const DURATION_RESTRICTION_OPTIONS = [
  { value: '0', label: '不限制' },
  { value: '1', label: '限 1 个月' },
  { value: '3', label: '限 3 个月' },
  { value: '6', label: '限 6 个月' },
  { value: '12', label: '限 12 个月' },
];

export default class DiscountCodesPage extends AdminPage {
  oninit(vnode) {
    super.oninit(vnode);

    this.loading = true;
    this.configLoading = true;
    this.generating = false;
    this.items = [];
    this.error = '';
    this.status = '';
    this.keyword = '';
    this.page = 1;
    this.pageSize = 10;
    this.meta = {
      total: 0,
      totalPages: 1,
      hasMore: false,
      offset: 0,
      limit: this.pageSize,
    };
    this.config = {
      amount: '',
      validDays: '',
      quantity: '1',
      usageLimit: '1',
      durationMonths: '0',
      allowedGroupIds: [],
      groups: [],
    };

    this.loadConfig();
    this.loadItems();
  }

  headerInfo() {
    return {
      className: 'AdSlotDiscountCodesPage',
      icon: 'fas fa-ticket-alt',
      title: '优惠码管理',
      description: '集中生成、筛选和查看后台及前台产生的优惠码。',
    };
  }

  content() {
    if (this.loading && this.configLoading) {
      return (
        <div className="AdSlotAdminPage">
          <div className="AdSlotAdminPage-shell">
            <LoadingIndicator display="block" />
          </div>
        </div>
      );
    }

    return (
      <div className="AdSlotAdminPage">
        <div className="AdSlotAdminPage-shell">
          <div className="AdSlotAdminCard">
            <div className="AdSlotAdminCard-head">
              <div>
                <h3>生成优惠码</h3>
                <p>使用当前优惠码配置生成后台码，生成后会自动刷新下方列表。</p>
              </div>
              <div className="AdSlotAdminCard-headActions">
                <LinkButton className="Button AdSlotAdminGhostButton" href={app.route('extension', { id: 'doingfb-adslot' })} icon="fas fa-arrow-left">
                  返回首页
                </LinkButton>
              </div>
            </div>

            <div className="AdSlotAdminToolbar AdSlotAdminToolbar--discountCreate">
              <label className="AdSlotAdminField">
                <span>抵扣金额</span>
                <input
                  className="FormControl"
                  type="number"
                  step="0.01"
                  value={this.config.amount}
                  oninput={(event) => (this.config.amount = event.target.value)}
                  disabled={this.configLoading || this.generating}
                />
              </label>

              <label className="AdSlotAdminField">
                <span>有效天数</span>
                <input
                  className="FormControl"
                  type="number"
                  min="1"
                  value={this.config.validDays}
                  oninput={(event) => (this.config.validDays = event.target.value)}
                  disabled={this.configLoading || this.generating}
                />
              </label>

              <label className="AdSlotAdminField">
                <span>优惠码数量</span>
                <input
                  className="FormControl"
                  type="number"
                  min="1"
                  max="100"
                  value={this.config.quantity}
                  oninput={(event) => (this.config.quantity = event.target.value)}
                  disabled={this.configLoading || this.generating}
                />
              </label>

              <label className="AdSlotAdminField">
                <span>优惠码可使用次数</span>
                <input
                  className="FormControl"
                  type="number"
                  min="1"
                  max="1000"
                  value={this.config.usageLimit}
                  oninput={(event) => (this.config.usageLimit = event.target.value)}
                  disabled={this.configLoading || this.generating}
                />
              </label>

              <label className="AdSlotAdminField">
                <span>适用投放时长</span>
                <select
                  className="FormControl"
                  value={this.config.durationMonths}
                  onchange={(event) => (this.config.durationMonths = event.target.value)}
                  disabled={this.configLoading || this.generating}
                >
                  {DURATION_RESTRICTION_OPTIONS.map((option) => (
                    <option value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <div className="AdSlotAdminToolbar-actions">
                {Button.component(
                  {
                    type: 'button',
                    className: 'Button Button--primary AdSlotAdminPrimaryButton',
                    icon: 'fas fa-plus',
                    loading: this.generating,
                    disabled: this.configLoading || this.generating,
                    onclick: () => this.generateCode(),
                  },
                  '生成优惠码'
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="AdSlotAdminPage-shell">
          <div className="AdSlotAdminCard AdSlotAdminCard--discountCodes">
            <div className="AdSlotAdminCard-head">
              <div>
                <h3>优惠码列表</h3>
                <p>按状态和码值快速筛选，查看归属、使用记录和有效期。</p>
              </div>
              <div className="AdSlotAdminCard-headActions">
                {Button.component(
                  {
                    type: 'button',
                    className: 'Button AdSlotAdminGhostButton',
                    icon: 'fas fa-rotate-right',
                    onclick: () => this.loadItems(),
                  },
                  '刷新'
                )}
              </div>
            </div>

            <div className="AdSlotAdminToolbar AdSlotAdminToolbar--discountFilters">
              <label className="AdSlotAdminField">
                <span>状态</span>
                <select className="FormControl" value={this.status} onchange={(event) => this.onStatusChange(event)}>
                  <option value="">全部</option>
                  <option value="available">可用</option>
                  <option value="used">已使用</option>
                  <option value="expired">已过期</option>
                </select>
              </label>

              <label className="AdSlotAdminField AdSlotAdminField--search">
                <span>优惠码</span>
                <input
                  className="FormControl"
                  value={this.keyword}
                  oninput={(event) => (this.keyword = event.target.value)}
                  placeholder="输入优惠码"
                />
              </label>

              <div className="AdSlotAdminToolbar-actions">
                {Button.component(
                  {
                    type: 'button',
                    className: 'Button AdSlotAdminGhostButton',
                    onclick: () => this.search(),
                  },
                  '搜索'
                )}
              </div>
            </div>

            {this.error ? <div className="AdSlotAdminPage-error">{this.error}</div> : null}
            {this.loading ? (
              <div className="AdSlotAdminPage-notice">
                <LoadingIndicator display="inline" size="small" /> 正在加载优惠码...
              </div>
            ) : null}

            {this.renderTable()}

            <div className="AdSlotAdminTableFooter">
              <div className="AdSlotAdminTableFooter-copy">
                第 <strong>{this.page}</strong> / <strong>{Math.max(this.meta.totalPages || 1, 1)}</strong> 页，共 <strong>{this.meta.total}</strong> 条
              </div>
              <div className="AdSlotAdminTableFooter-actions">
                {Button.component(
                  {
                    type: 'button',
                    className: 'Button AdSlotAdminGhostButton',
                    disabled: this.page <= 1,
                    onclick: () => this.goToPage(this.page - 1),
                  },
                  '上一页'
                )}
                {Button.component(
                  {
                    type: 'button',
                    className: 'Button AdSlotAdminGhostButton',
                    disabled: this.page >= (this.meta.totalPages || 1),
                    onclick: () => this.goToPage(this.page + 1),
                  },
                  '下一页'
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  renderTable() {
    return (
      <div className="AdSlotAdminTableWrap">
        <table className="AdSlotAdminTable AdSlotAdminTable--discountCodes">
          <thead>
            <tr>
              <th>ID</th>
              <th>优惠码</th>
              <th className="AdSlotDiscountCodeTable-statusHead">状态</th>
              <th>金额 / 适用时长</th>
              <th className="AdSlotDiscountCodeTable-dateHead">有效期</th>
              <th>归属 / 创建</th>
              <th>使用记录</th>
              <th>生成时间</th>
            </tr>
          </thead>
          <tbody>
            {this.items.length ? (
              this.items.map((item) => this.renderRow(item))
            ) : (
              <tr>
                <td colSpan="8" className="AdSlotAdminTable-empty">
                  当前暂无优惠码
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  renderRow(item) {
    return (
      <tr key={item.id}>
        <td className="AdSlotAdminTable-colId">#{item.id}</td>
        <td>
          <div className="AdSlotDiscountCodeTable-codeCell">
            <strong>{item.code}</strong>
            {Button.component(
              {
                type: 'button',
                className: 'Button Button--small AdSlotAdminAction AdSlotAdminAction--icon',
                icon: 'fas fa-copy',
                title: '复制优惠码',
                onclick: () => this.copyCode(item.code),
              },
              ''
            )}
          </div>
        </td>
        <td className="AdSlotDiscountCodeTable-status">
          <div className="AdSlotDiscountCodeTable-statusCell">
            {this.renderCodeStatus(item.status)}
            <span className="AdSlotDiscountCodeTable-usage">
              已用 {Number(item.usedCount || 0)} / {Number(item.usageLimit || 1)}
            </span>
          </div>
        </td>
        <td>
          <div className="AdSlotAdminTable-stack">
            <span className="AdSlotAdminTable-sub is-strong">{this.formatMoney(item.amount)}</span>
            <span className={`AdSlotAdminTable-chip${item.durationMonths ? '' : ' AdSlotAdminTable-chip--soft'}`}>
              {this.durationRestrictionLabel(item.durationMonths)}
            </span>
          </div>
        </td>
        <td className="AdSlotDiscountCodeTable-date">
          <div className="AdSlotDiscountCodeTable-dateCell">
            <div>{this.formatDate(item.startsAt)}</div>
            <div>{this.formatDate(item.expiresAt)}</div>
            <span>{item.validDays || 0} 天</span>
          </div>
        </td>
        <td>
          <div className="AdSlotAdminTable-stack">
            <span className="AdSlotAdminTable-sub is-strong">{this.userLabel(item.ownerUser) || '后台生成'}</span>
            <span className="AdSlotAdminTable-sub">创建：{this.userLabel(item.createdBy) || '-'}</span>
          </div>
        </td>
        <td>
          <div className="AdSlotAdminTable-stack">
            <span className="AdSlotAdminTable-sub is-strong">{this.userLabel(item.usedBy) || '-'}</span>
            <span className="AdSlotAdminTable-sub">{item.usedItem ? `商家 #${item.usedItem.id} ${item.usedItem.merchantName || ''}` : '未绑定商家'}</span>
            <span className="AdSlotAdminTable-sub">{this.formatDate(item.usedAt)}</span>
          </div>
        </td>
        <td className="AdSlotAdminTable-colTime">{this.formatDate(item.createdAt)}</td>
      </tr>
    );
  }

  onStatusChange(event) {
    this.status = event.target.value;
    this.search();
  }

  search() {
    this.page = 1;
    this.loadItems();
  }

  goToPage(page) {
    this.page = Math.max(1, page);
    this.loadItems();
  }

  async loadConfig() {
    this.configLoading = true;

    try {
      const response = await app.request({
        method: 'GET',
        url: `${this.apiUrl()}/adslot/admin/config`,
      });
      const data = response.data || {};

      this.config = {
        amount: String(data.defaultDiscountAmount ?? ''),
        validDays: String(data.defaultDiscountValidDays ?? ''),
        quantity: '1',
        usageLimit: '1',
        durationMonths: '0',
        allowedGroupIds: data.discountEnabledGroupIds || [],
        groups: data.groups || [],
      };
    } catch (error) {
      this.showAlert('error', error.message || '配置加载失败');
    }

    this.configLoading = false;
    m.redraw();
  }

  async loadItems() {
    this.loading = true;
    this.error = '';
    m.redraw();

    try {
      const response = await app.request({
        method: 'GET',
        url: `${this.apiUrl()}/adslot/admin/discount-codes`,
        params: {
          status: this.status || undefined,
          q: this.keyword.trim() || undefined,
          'page[offset]': (this.page - 1) * this.pageSize,
          'page[limit]': this.pageSize,
        },
      });

      this.items = response.data || [];
      this.meta = response.meta || this.meta;
      this.page = this.meta.page || this.page;
    } catch (error) {
      this.error = error.message || '加载失败';
    }

    this.loading = false;
    m.redraw();
  }

  async generateCode() {
    this.generating = true;
    m.redraw();

    try {
      const response = await app.request({
        method: 'POST',
        url: `${this.apiUrl()}/adslot/discount-codes/generate`,
        body: {
          data: {
            attributes: {
              amount: Number(this.config.amount || 0),
              validDays: Number(this.config.validDays || 0),
              quantity: Number(this.config.quantity || 1),
              usageLimit: Number(this.config.usageLimit || 1),
              durationMonths: Number(this.config.durationMonths || 0) || null,
            },
          },
        },
      });
      const codes = Array.isArray(response.data) ? response.data : [response.data].filter(Boolean);
      const code = codes[0]?.code;

      this.showAlert('success', code ? `已生成 ${codes.length} 个后台优惠码，示例：${code}` : '优惠码已生成。');
      this.page = 1;
      await this.loadItems();
    } catch (error) {
      this.showAlert('error', error.message || '优惠码生成失败');
    }

    this.generating = false;
    m.redraw();
  }

  copyCode(code) {
    if (!code) {
      return;
    }

    navigator.clipboard?.writeText(code);
    this.showAlert('success', '优惠码已复制。');
  }

  allowedGroupNames() {
    const selected = new Set((this.config.allowedGroupIds || []).map((id) => Number(id)));
    const names = (this.config.groups || []).filter((group) => selected.has(Number(group.id))).map((group) => group.name);

    return names.length ? names.join('、') : '未选择用户组';
  }

  renderCodeStatus(status) {
    const labelMap = {
      available: '可用',
      used: '已使用',
      expired: '已过期',
    };

    return <span className={`AdSlotBadge is-discount-${status || 'available'}`}>{labelMap[status] || status || '-'}</span>;
  }

  durationRestrictionLabel(value) {
    const months = Number(value || 0);

    return months ? `限 ${months} 个月` : '不限时长';
  }

  userLabel(user) {
    if (!user) {
      return '';
    }

    return user.displayName || user.username || `#${user.id}`;
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

  showAlert(type, message) {
    if (app.alerts && typeof app.alerts.show === 'function') {
      app.alerts.show({ type }, message);
      m.redraw();
    }
  }

  apiUrl() {
    return (app.forum && app.forum.attribute('apiUrl')) || app.data?.apiUrl || '';
  }
}
