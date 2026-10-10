import app from 'flarum/admin/app';
import AdminPage from 'flarum/common/components/Page';
import Button from 'flarum/common/components/Button';
import LinkButton from 'flarum/common/components/LinkButton';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
import ImagePreviewModal from './ImagePreviewModal';

export default class RenewalsPage extends AdminPage {
  oninit(vnode) {
    super.oninit(vnode);

    this.loading = true;
    this.reviewingId = null;
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

    this.loadItems();
  }

  headerInfo() {
    return {
      className: 'AdSlotRenewalsPage',
      icon: 'fas fa-rotate-right',
      title: '续费审核',
      description: '审核广告续费申请；通过后只延长原广告到期时间，不创建新的广告展示记录。',
    };
  }

  content() {
    if (this.loading && this.items.length === 0) {
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
          <div className="AdSlotAdminCard AdSlotAdminCard--renewals">
            <div className="AdSlotAdminCard-head">
              <div>
                <h3>续费审核</h3>
                <p>未到期续费从原到期日顺延；已到期续费从管理员审核通过日重新起算。</p>
              </div>
              <div className="AdSlotAdminCard-headActions">
                <LinkButton className="Button AdSlotAdminGhostButton" href={app.route('extension', { id: 'doingfb-adslot' })} icon="fas fa-arrow-left">
                  返回首页
                </LinkButton>
              </div>
            </div>

            <div className="AdSlotAdminToolbar AdSlotAdminToolbar--renewalFilters">
              <label className="AdSlotAdminField">
                <span>状态</span>
                <select className="FormControl" value={this.status} onchange={(event) => this.onStatusChange(event)}>
                  <option value="">全部</option>
                  <option value="pending">待审核</option>
                  <option value="approved">已通过</option>
                  <option value="rejected">已驳回</option>
                </select>
              </label>

              <label className="AdSlotAdminField AdSlotAdminField--search">
                <span>商家搜索</span>
                <input
                  className="FormControl"
                  value={this.keyword}
                  oninput={(event) => (this.keyword = event.target.value)}
                  placeholder="输入商家名称"
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

            {this.error ? <div className="AdSlotAdminPage-error">{this.error}</div> : null}
            {this.loading ? (
              <div className="AdSlotAdminPage-notice">
                <LoadingIndicator display="inline" size="small" /> 正在加载续费申请...
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
        <table className="AdSlotAdminTable AdSlotAdminTable--renewals">
          <thead>
            <tr>
              <th>ID</th>
              <th>商家 / 用户</th>
              <th>续费时长</th>
              <th>费用</th>
              <th>支付凭证</th>
              <th>原到期</th>
              <th>新到期</th>
              <th>状态</th>
              <th>提交时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {this.items.length ? (
              this.items.map((item) => this.renderRow(item))
            ) : (
              <tr>
                <td colSpan="9" className="AdSlotAdminTable-empty">
                  当前暂无续费申请
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  }

  renderRow(item) {
    const attrs = item.attributes || {};
    const originalItem = attrs.item || {};
    const merchantName = originalItem.merchantName || `广告 #${attrs.itemId || '-'}`;
    const isPending = attrs.status === 'pending';

    return (
      <tr key={item.id}>
        <td className="AdSlotAdminTable-colId">#{item.id}</td>
        <td>
          <div className="AdSlotAdminTable-stack">
            <span className="AdSlotAdminTable-sub is-strong">{merchantName}</span>
            <span className="AdSlotAdminTable-sub">用户：{attrs.username || `#${attrs.userId || '-'}`}</span>
            <span className="AdSlotAdminTable-sub">原广告：#{attrs.itemId}</span>
            <span className="AdSlotAdminTable-sub">联系方式类型：{this.contactTypeLabel(attrs.contactType)}</span>
            <span className="AdSlotAdminTable-sub">联系方式账号：{attrs.contactValue || '-'}</span>
          </div>
        </td>
        <td>
          <span className="AdSlotAdminTable-chip AdSlotAdminTable-chip--soft">{Number(attrs.durationMonths || 1)} 个月</span>
        </td>
        <td>
          <div className="AdSlotAdminTable-stack AdSlotAdminTable-stack--tight">
          </div>
        </td>
        <td className="AdSlotAdminTable-colTime">{this.formatDateOnly(attrs.oldEndsAt || originalItem.endsAt)}</td>
        <td className="AdSlotAdminTable-colTime">{attrs.newEndsAt ? this.formatDateOnly(attrs.newEndsAt) : '审核后计算'}</td>
        <td>{this.renderStatusBadge(attrs.status)}</td>
        <td className="AdSlotAdminTable-colTime">{this.formatDate(attrs.createdAt)}</td>
        <td className="AdSlotAdminTable-colActions">
          <div className="AdSlotAdminTable-actions">
            {Button.component(
              {
                type: 'button',
                className: 'Button Button--small AdSlotAdminAction AdSlotAdminAction--icon is-success',
                icon: 'fas fa-check',
                title: '通过',
                'aria-label': '通过',
                disabled: !isPending || this.reviewingId === item.id,
                loading: this.reviewingId === item.id,
                onclick: () => this.review(item.id, 'approved'),
              },
              ''
            )}
            {Button.component(
              {
                type: 'button',
                className: 'Button Button--small AdSlotAdminAction AdSlotAdminAction--icon is-warning',
                icon: 'fas fa-ban',
                title: '驳回',
                'aria-label': '驳回',
                disabled: !isPending || this.reviewingId === item.id,
                onclick: () => this.review(item.id, 'rejected'),
              },
              ''
            )}
          </div>
        </td>
      </tr>
    );
  }

  renderThumb(src, title) {
    if (!src) {
      return <span className="AdSlotAdminTable-thumbPlaceholder">未传</span>;
    }

    return (
      <button
        type="button"
        className="AdSlotAdminThumbButton"
        title={title}
        aria-label={title}
        onclick={() => app.modal.show(ImagePreviewModal, { src, title, alt: title })}
      >
        <span className="AdSlotAdminTable-thumb">
          <img src={src} alt={title} />
        </span>
      </button>
    );
  }

  renderStatusBadge(status) {
    const labelMap = {
      pending: '待审核',
      approved: '已通过',
      rejected: '已驳回',
    };

    return <span className={`AdSlotBadge is-${status || 'pending'}`}>{labelMap[status] || status || '-'}</span>;
  }

  contactTypeLabel(type) {
    const labelMap = {
      wechat: '微信',
      telegram: 'Telegram',
      email: '邮箱',
    };

    return labelMap[type] || '沿用原设置';
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

  async loadItems() {
    this.loading = true;
    this.error = '';
    m.redraw();

    try {
      const response = await app.request({
        method: 'GET',
        url: `${this.apiUrl()}/adslot/admin/renewals`,
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
      this.error = this.errorMessage(error) || '加载失败';
    }

    this.loading = false;
    m.redraw();
  }

  async review(id, status) {
    if (status === 'rejected' && !confirm('确认驳回这条续费申请吗？')) {
      return;
    }

    this.reviewingId = id;
    m.redraw();

    try {
      await app.request({
        method: 'POST',
        url: `${this.apiUrl()}/adslot/admin/renewals/${id}/review`,
        body: {
          data: {
            attributes: { status },
          },
        },
      });

      app.alerts.show({ type: 'success' }, status === 'approved' ? '续费已通过，原广告到期时间已更新。' : '续费申请已驳回。');
      await this.loadItems();
    } catch (error) {
      app.alerts.show({ type: 'error' }, this.errorMessage(error) || '审核失败');
    }

    this.reviewingId = null;
    m.redraw();
  }

  formatMoney(value) {
    return `${Number(value || 0).toFixed(2)} 元`;
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
      hour12: false,
    })
      .format(date)
      .replace(/\//g, '-');
  }

  formatDateOnly(value) {
    if (!value) {
      return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value).replace('T', ' ').slice(0, 10);
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

  errorMessage(error) {
    return error?.response?.errors?.[0]?.detail || error?.response?.errors?.[0]?.message || error?.message || '';
  }

  apiUrl() {
    return (app.forum && app.forum.attribute('apiUrl')) || app.data?.apiUrl || '';
  }
}
