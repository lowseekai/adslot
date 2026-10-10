import app from 'flarum/admin/app';
import AdminPage from 'flarum/common/components/Page';
import Button from 'flarum/common/components/Button';
import LinkButton from 'flarum/common/components/LinkButton';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
import EditItemModal from './EditItemModal';
import ReviewTable from './ReviewTable';

export default class ReviewsPage extends AdminPage {
  oninit(vnode) {
    super.oninit(vnode);

    this.loading = true;
    this.items = [];
    this.error = '';
    this.filterStatus = '';
    this.filterVisible = '';
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
      className: 'AdSlotReviewsPage',
      icon: 'fas fa-table-list',
      title: '完整审核列表',
      description: '分页查看全部商家审核数据，并在这里完成批量筛选与处理。',
    };
  }

  content() {
    if (this.loading) {
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
                <h3>完整审核列表</h3>
                <p>这里按分页展示全部商家审核数据，便于逐页处理，避免后台首页信息过多。</p>
              </div>
              <div className="AdSlotAdminCard-headActions">
                <LinkButton className="Button AdSlotAdminGhostButton" href={app.route('extension', { id: 'doingfb-adslot' })} icon="fas fa-arrow-left">
                  返回首页
                </LinkButton>
              </div>
            </div>

            <div className="AdSlotAdminToolbar">
              <label className="AdSlotAdminField">
                <span>状态</span>
                <select className="FormControl" value={this.filterStatus} onchange={(event) => this.onStatusChange(event)}>
                  <option value="">全部</option>
                  <option value="pending">待审核</option>
                  <option value="approved">已通过</option>
                  <option value="rejected">已驳回</option>
                </select>
              </label>

              <label className="AdSlotAdminField">
                <span>显示</span>
                <select className="FormControl" value={this.filterVisible} onchange={(event) => this.onVisibleChange(event)}>
                  <option value="">全部</option>
                  <option value="true">显示中</option>
                  <option value="false">隐藏中</option>
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
                    className: 'Button AdSlotAdminGhostButton',
                    onclick: () => this.search(),
                  },
                  '搜索'
                )}
              </div>
            </div>

            {this.error ? <div className="AdSlotAdminPage-error">{this.error}</div> : null}

            <ReviewTable
              items={this.items}
              emptyText="当前筛选条件下暂无审核数据"
              formatMoney={(value) => this.formatMoney(value)}
              formatDate={(value) => this.formatDate(value)}
              renderStatusBadge={(status) => this.renderStatusBadge(status)}
              renderVisibleBadge={(isVisible) => this.renderVisibleBadge(isVisible)}
              onEdit={(item) => this.openEditModal(item)}
              onApprove={(item) => this.quickUpdate(item.id, { status: 'approved', isVisible: true })}
              onReject={(item) => this.quickUpdate(item.id, { status: 'rejected', isVisible: false })}
              onTogglePinned={(item) => this.togglePinned(item)}
              onToggleVisible={(item) => this.toggleVisible(item)}
              onDelete={(item) => this.deleteItem(item)}
            />

            <div className="AdSlotAdminTableFooter">
              <div className="AdSlotAdminTableFooter-copy">
                第 {this.page} / {Math.max(this.meta.totalPages || 1, 1)} 页，共 {this.meta.total} 条
              </div>
              <div className="AdSlotAdminTableFooter-actions">
                {Button.component(
                  {
                    className: 'Button AdSlotAdminGhostButton',
                    disabled: this.page <= 1,
                    onclick: () => this.goToPage(this.page - 1),
                  },
                  '上一页'
                )}
                {Button.component(
                  {
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

  onStatusChange(event) {
    this.filterStatus = event.target.value;
    this.search();
  }

  onVisibleChange(event) {
    this.filterVisible = event.target.value;
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
        url: `${this.apiUrl()}/adslot/admin/items`,
        params: {
          status: this.filterStatus || undefined,
          isVisible: this.filterVisible === '' ? undefined : this.filterVisible,
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

  openEditModal(item) {
    app.modal.show(EditItemModal, {
      item,
      onsaved: () => this.loadItems(),
    });
  }

  async quickUpdate(id, attributes) {
    await app.request({
      method: 'POST',
      url: `${this.apiUrl()}/adslot/admin/items/update`,
      body: { data: { id, attributes } },
    });

    this.loadItems();
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

  async deleteItem(item) {
    if (!confirm('确认删除这条商家记录吗？')) {
      return;
    }

    await app.request({
      method: 'POST',
      url: `${this.apiUrl()}/adslot/admin/items/delete`,
      body: { data: { id: item.id } },
    });

    this.page = this.items.length === 1 && this.page > 1 ? this.page - 1 : this.page;
    this.loadItems();
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
