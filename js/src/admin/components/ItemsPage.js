import app from 'flarum/admin/app';
import ExtensionPage from 'flarum/admin/components/ExtensionPage';
import Button from 'flarum/common/components/Button';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
import EditItemModal from './EditItemModal';

const CONTACT_LABELS = {
  wechat: '微信',
  telegram: 'Telegram',
  email: '邮箱',
};

export default class ItemsPage extends ExtensionPage {
  oninit(vnode) {
    super.oninit(vnode);

    this.loading = true;
    this.configLoading = true;
    this.configSaving = false;
    this.codeGenerating = false;
    this.items = [];
    this.error = null;
    this.configError = '';
    this.configNotice = '';
    this.generatedAdminCode = null;
    this.filterStatus = '';
    this.filterVisible = '';
    this.keyword = '';
    this.config = {
      baseMonthlyFee: '',
      defaultDiscountAmount: '',
      defaultDiscountValidDays: '',
      discountEnabledGroupIds: [],
      groups: [],
    };

    this.loadItems();
    this.loadConfig();
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
          <div className="AdSlotAdminHero" style="margin-top: 20px; border-top-width: 0;">
            <div>
              <div className="AdSlotAdminHero-eyebrow">AdSlot</div>
              <h2>商家合作审核</h2>
              <p>这里只做审核、上下架、排序、结算和优惠码控制。</p>
            </div>

            <div className="AdSlotAdminHero-side">
              <div className="AdSlotAdminHero-stat">
                <strong>{this.items.length}</strong>
                <span>当前结果</span>
              </div>
              {Button.component(
                {
                  className: 'Button Button--primary AdSlotAdminPrimaryButton',
                  icon: 'fas fa-rotate-right',
                  onclick: () => this.loadItems(),
                },
                '刷新列表'
              )}
            </div>
          </div>
        </div>

        <div className="AdSlotAdminPage-shell">
          <div className="AdSlotAdminCard">
            <div className="AdSlotAdminCard-head">
              <div>
                <h3>费用与优惠码设置</h3>
                <p>设置广告费、默认优惠金额、有效期，以及哪些用户组可在前台生成优惠码。</p>
              </div>
            </div>

            <div className="AdSlotAdminToolbar AdSlotAdminToolbar--config">
              <label className="AdSlotAdminField">
                <span>广告费 / 月</span>
                <input
                  className="FormControl"
                  type="number"
                  step="0.01"
                  value={this.config.baseMonthlyFee}
                  oninput={(event) => (this.config.baseMonthlyFee = event.target.value)}
                  disabled={this.configLoading || this.configSaving}
                />
              </label>

              <label className="AdSlotAdminField">
                <span>默认抵扣金额</span>
                <input
                  className="FormControl"
                  type="number"
                  step="0.01"
                  value={this.config.defaultDiscountAmount}
                  oninput={(event) => (this.config.defaultDiscountAmount = event.target.value)}
                  disabled={this.configLoading || this.configSaving}
                />
              </label>

              <label className="AdSlotAdminField">
                <span>默认有效天数</span>
                <input
                  className="FormControl"
                  type="number"
                  value={this.config.defaultDiscountValidDays}
                  oninput={(event) => (this.config.defaultDiscountValidDays = event.target.value)}
                  disabled={this.configLoading || this.configSaving}
                />
              </label>

              <div className="AdSlotAdminToolbar-actions">
                {Button.component(
                  {
                    className: 'Button Button--primary AdSlotAdminPrimaryButton',
                    loading: this.configSaving,
                    onclick: () => this.saveConfig(),
                    disabled: this.configLoading || this.configSaving,
                  },
                  '保存设置'
                )}
              </div>
            </div>

            <div className="AdSlotAdminConfigGroups">
              <span className="AdSlotAdminConfigLabel">前台可生成优惠码的用户组</span>
              <div className="AdSlotAdminConfigChecks">
                {this.config.groups.map((group) => (
                  <label className="checkbox">
                    <input
                      type="checkbox"
                      checked={this.config.discountEnabledGroupIds.includes(group.id)}
                      onchange={() => this.toggleGroup(group.id)}
                      disabled={this.configLoading || this.configSaving}
                    />
                    {group.name}
                  </label>
                ))}
              </div>
            </div>

            <div className="AdSlotAdminConfigFooter">
              {Button.component(
                {
                  className: 'Button AdSlotAdminGhostButton',
                  loading: this.codeGenerating,
                  onclick: () => this.generateAdminCode(),
                },
                '后台生成优惠码'
              )}
              {this.generatedAdminCode ? (
                <div className="AdSlotAdminGeneratedCode">
                  <strong>{this.generatedAdminCode.code}</strong>
                  <span>
                    抵扣 {this.formatMoney(this.generatedAdminCode.amount)}，有效期至 {this.formatDate(this.generatedAdminCode.expiresAt)}
                  </span>
                </div>
              ) : null}
            </div>

            {this.configError ? <div className="AdSlotAdminPage-error">{this.configError}</div> : null}
            {this.configNotice ? <div className="AdSlotAdminPage-notice">{this.configNotice}</div> : null}
          </div>
        </div>

        <div className="AdSlotAdminPage-shell">
          <div className="AdSlotAdminCard">
            <div className="AdSlotAdminCard-head">
              <div>
                <h3>筛选条件</h3>
                <p>按状态、显示状态或商家名称过滤审核列表。</p>
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
                    onclick: () => this.loadItems(),
                  },
                  '搜索'
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="AdSlotAdminPage-shell">
          <div className="AdSlotAdminCard AdSlotAdminCard--table">
            <div className="AdSlotAdminCard-head">
              <div>
                <h3>审核列表</h3>
                <p>支持通过、驳回、修改、删除、上下架、优惠码和支付凭证管理。</p>
              </div>
            </div>

            {this.error ? <div className="AdSlotAdminPage-error">{this.error}</div> : null}

            <div className="AdSlotAdminTableWrap">
              <table className="AdSlotAdminTable">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>商家名称</th>
                    <th>广告图</th>
                    <th>链接</th>
                    <th>优惠码</th>
                    <th>支付凭证</th>
                    <th>广告费</th>
                    <th>抵扣</th>
                    <th>应付</th>
                    <th>状态</th>
                    <th>显示</th>
                    <th>排序</th>
                    <th>时间</th>
                    <th>提交时间</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {this.items.length ? (
                    this.items.map((item) => this.renderRow(item))
                  ) : (
                    <tr>
                      <td colSpan="15" className="AdSlotAdminTable-empty">
                        暂无数据
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    );
  }

  renderRow(item) {
    const attrs = item.attributes || {};

    return (
      <tr key={item.id}>
        <td>{item.id}</td>
        <td className="AdSlotAdminTable-colMerchant">
          <div className="AdSlotAdminTable-name">{attrs.merchantName}</div>
          <div className="AdSlotAdminTable-sub">{this.formatContact(attrs)}</div>
        </td>
        <td>
          <div className="AdSlotAdminTable-thumb">{attrs.imagePath ? <img src={attrs.imagePath} alt={attrs.merchantName} /> : null}</div>
        </td>
        <td className="AdSlotAdminTable-colLink">
          <a href={attrs.targetUrl} target="_blank" rel="noreferrer">
            {this.shortUrl(attrs.targetUrl)}
          </a>
        </td>
        <td>{attrs.discountCode || '-'}</td>
        <td>{this.renderPaymentProof(attrs)}</td>
        <td>{this.formatMoney(attrs.adFeeAmount)}</td>
        <td>{this.formatMoney(attrs.discountAmount)}</td>
        <td>{this.formatMoney(attrs.payableAmount)}</td>
        <td>{this.renderStatusBadge(attrs.status)}</td>
        <td>{this.renderVisibleBadge(attrs.isVisible)}</td>
        <td>{attrs.sortOrder || 0}</td>
        <td className="AdSlotAdminTable-colTime">
          <div>{this.formatDate(attrs.startsAt)}</div>
          <div>{this.formatDate(attrs.endsAt)}</div>
        </td>
        <td>{this.formatDate(attrs.createdAt)}</td>
        <td>
          <div className="AdSlotAdminTable-actions">
            {Button.component(
              {
                className: 'Button Button--small AdSlotAdminAction',
                onclick: () => this.openEditModal(item),
              },
              '修改'
            )}
            {Button.component(
              {
                className: 'Button Button--small AdSlotAdminAction is-success',
                onclick: () => this.quickUpdate(item.id, { status: 'approved', isVisible: true }),
              },
              '通过'
            )}
            {Button.component(
              {
                className: 'Button Button--small AdSlotAdminAction is-warning',
                onclick: () => this.quickUpdate(item.id, { status: 'rejected', isVisible: false }),
              },
              '驳回'
            )}
            {Button.component(
              {
                className: 'Button Button--small AdSlotAdminAction',
                onclick: () => this.toggleVisible(item),
              },
              attrs.isVisible ? '下架' : '上架'
            )}
            {Button.component(
              {
                className: 'Button Button--small Button--danger AdSlotAdminAction is-danger',
                onclick: () => this.deleteItem(item.id),
              },
              '删除'
            )}
          </div>
        </td>
      </tr>
    );
  }

  renderPaymentProof(attrs) {
    if (!attrs.paymentProofPath) {
      return '-';
    }

    return (
      <a className="AdSlotAdminTable-thumb" href={attrs.paymentProofPath} target="_blank" rel="noreferrer">
        <img src={attrs.paymentProofPath} alt="payment-proof" />
      </a>
    );
  }

  formatContact(attrs) {
    const value = attrs.contactValue || attrs.contact;

    if (!value) {
      return '-';
    }

    const label = CONTACT_LABELS[attrs.contactType] || '联系方式';

    return `${label}：${value}`;
  }

  onStatusChange(event) {
    this.filterStatus = event.target.value;
    this.loadItems();
  }

  onVisibleChange(event) {
    this.filterVisible = event.target.value;
    this.loadItems();
  }

  async loadItems() {
    this.loading = true;
    this.error = null;
    m.redraw();

    try {
      const params = {};

      if (this.filterStatus) {
        params.status = this.filterStatus;
      }

      if (this.filterVisible !== '') {
        params.isVisible = this.filterVisible;
      }

      if (this.keyword.trim()) {
        params.q = this.keyword.trim();
      }

      const response = await app.request({
        method: 'GET',
        url: `${this.apiUrl()}/adslot/admin/items`,
        params,
      });

      this.items = response.data || [];
    } catch (error) {
      this.error = error.message || '加载失败';
    }

    this.loading = false;
    m.redraw();
  }

  async loadConfig() {
    this.configLoading = true;
    this.configError = '';
    this.configNotice = '';
    m.redraw();

    try {
      const response = await app.request({
        method: 'GET',
        url: `${this.apiUrl()}/adslot/admin/config`,
      });

      const data = response.data || {};
      this.config = {
        baseMonthlyFee: String(data.baseMonthlyFee ?? ''),
        defaultDiscountAmount: String(data.defaultDiscountAmount ?? ''),
        defaultDiscountValidDays: String(data.defaultDiscountValidDays ?? ''),
        discountEnabledGroupIds: data.discountEnabledGroupIds || [],
        groups: data.groups || [],
      };
    } catch (error) {
      this.configError = error.message || '配置加载失败';
    }

    this.configLoading = false;
    m.redraw();
  }

  async saveConfig() {
    this.configSaving = true;
    this.configError = '';
    this.configNotice = '';
    m.redraw();

    try {
      await app.request({
        method: 'POST',
        url: `${this.apiUrl()}/adslot/admin/config`,
        body: {
          data: {
            attributes: {
              baseMonthlyFee: Number(this.config.baseMonthlyFee || 0),
              defaultDiscountAmount: Number(this.config.defaultDiscountAmount || 0),
              defaultDiscountValidDays: Number(this.config.defaultDiscountValidDays || 0),
              discountEnabledGroupIds: this.config.discountEnabledGroupIds,
            },
          },
        },
      });

      this.configNotice = '费用与优惠码配置已保存。';
    } catch (error) {
      this.configError = error.message || '配置保存失败';
    }

    this.configSaving = false;
    m.redraw();
  }

  toggleGroup(groupId) {
    if (this.config.discountEnabledGroupIds.includes(groupId)) {
      this.config.discountEnabledGroupIds = this.config.discountEnabledGroupIds.filter((id) => id !== groupId);
      return;
    }

    this.config.discountEnabledGroupIds = [...this.config.discountEnabledGroupIds, groupId];
  }

  async generateAdminCode() {
    this.codeGenerating = true;
    this.configError = '';
    this.configNotice = '';
    m.redraw();

    try {
      const response = await app.request({
        method: 'POST',
        url: `${this.apiUrl()}/adslot/discount-codes/generate`,
        body: {
          data: {
            attributes: {
              amount: Number(this.config.defaultDiscountAmount || 0),
              validDays: Number(this.config.defaultDiscountValidDays || 0),
              allowedGroupIds: this.config.discountEnabledGroupIds,
            },
          },
        },
      });

      this.generatedAdminCode = response.data || null;
      this.configNotice = '后台优惠码已生成。';
    } catch (error) {
      this.configError = error.message || '优惠码生成失败';
    }

    this.codeGenerating = false;
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

  async deleteItem(id) {
    if (!confirm('确认删除这条商家记录吗？')) {
      return;
    }

    await app.request({
      method: 'POST',
      url: `${this.apiUrl()}/adslot/admin/items/delete`,
      body: { data: { id } },
    });

    this.loadItems();
  }

  shortUrl(url) {
    if (!url) {
      return '-';
    }

    return url.replace(/^https?:\/\//, '').slice(0, 32);
  }

  formatDate(value) {
    if (!value) {
      return '-';
    }

    return String(value).replace('T', ' ').slice(0, 16);
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
    if (app.forum) {
      return app.forum.attribute('apiUrl');
    }

    return app.data.apiUrl;
  }
}
