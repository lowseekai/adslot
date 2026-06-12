import app from 'flarum/admin/app';
import Component from 'flarum/common/Component';
import Button from 'flarum/common/components/Button';
import LinkButton from 'flarum/common/components/LinkButton';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
import EditItemModal from './EditItemModal';
import ReviewTable from './ReviewTable';

export default class ExtensionPanel extends Component {
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
    this.codeGenerating = false;
    this.paymentQrUploading = {
      wechat: false,
      alipay: false,
      usdt: false,
    };
    this.configSectionExpanded = {
      notice: false,
      payment: false,
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
    this.generatedAdminCode = null;
    this.config = {
      baseMonthlyFee: '',
      defaultDiscountAmount: '',
      defaultDiscountValidDays: '',
      personalDiscountCodeLimit: '1',
      discountEnabledGroupIds: [],
      noticeBarEnabled: true,
      noticeBarText: '活动即将到来',
      paymentGuideEnabled: true,
      paymentGuideTitle: '支付方式',
      paymentGuideText: '请先按以下收款信息完成转账，支付成功后再上传支付凭证。',
      paymentExtraText: '完成付款后，请上传包含金额、时间和收款方信息的转账截图。',
      paymentWechatAccount: '',
      paymentWechatQrCodeUrl: '',
      paymentWechatNote: '支持微信扫码或转账付款。',
      paymentAlipayAccount: '',
      paymentAlipayQrCodeUrl: '',
      paymentAlipayNote: '支持支付宝扫码或转账付款。',
      paymentUsdtAccount: '',
      paymentUsdtQrCodeUrl: '',
      paymentUsdtNote: '仅支持 USDT 转账，请确认链类型和地址无误。',
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

  view() {
    return (
      <div className="AdSlotAdminPage">
        <div className="AdSlotAdminPage-shell">
          <div className="AdSlotAdminHero" style="margin-top: 20px; border-top-width: 0;">
            <div>
              <div className="AdSlotAdminHero-eyebrow">AdSlot</div>
              <h2>商家合作审核</h2>
              <p>首页仅保留最近 10 条审核数据，完整审核列表进入更多页面查看并分页处理。</p>
            </div>

            <div className="AdSlotAdminHero-side">
              <div className="AdSlotAdminHero-stat">
                <strong>{this.meta.total}</strong>
                <span>总商家数据</span>
              </div>
              <div className="AdSlotAdminHero-stat AdSlotAdminHero-stat--pending">
                <strong>{this.pendingTotal}</strong>
                <span>待审核数</span>
              </div>
              {Button.component(
                {
                  type: 'button',
                  className: 'Button Button--primary AdSlotAdminPrimaryButton',
                  icon: 'fas fa-rotate-right',
                  onclick: () => this.loadRecentItems(),
                },
                '刷新最近数据'
              )}
            </div>
          </div>
        </div>

        <div className="AdSlotAdminPage-shell">
          <div className="AdSlotAdminCard">
            <div className="AdSlotAdminCard-head">
              <div>
                <h3>配置中心</h3>
                <p>费用、前台公告和优惠码权限分区管理；每个模块可单独保存当前设置。</p>
              </div>
              <div className="AdSlotAdminCard-headActions">
                <LinkButton className="Button AdSlotAdminGhostButton" href={app.route('adslotDiscountCodes')} icon="fas fa-ticket-alt">
                  优惠码管理
                </LinkButton>
                <LinkButton className="Button AdSlotAdminGhostButton" href={app.route('adslotRenewals')} icon="fas fa-rotate-right">
                  续费审核
                </LinkButton>
              </div>
            </div>

            <div className="AdSlotAdminConfigSections">
              <section className="AdSlotAdminConfigSection">
                <div className="AdSlotAdminConfigSection-head">
                  <div>
                    <h4>费用与优惠码</h4>
                    <p>控制前台申请费用、默认抵扣和优惠码有效期。</p>
                  </div>
                  {Button.component(
                    {
                      type: 'button',
                      className: 'Button Button--primary AdSlotAdminPrimaryButton',
                      loading: this.configSavingModule === 'fees',
                      onclick: () => this.saveFeesConfig(),
                      disabled: this.configLoading || this.configSaving,
                    },
                    '保存费用设置'
                  )}
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

                  <label className="AdSlotAdminField">
                    <span>每人有效未使用码上限</span>
                    <input
                      className="FormControl"
                      type="number"
                      min="1"
                      value={this.config.personalDiscountCodeLimit}
                      oninput={(event) => (this.config.personalDiscountCodeLimit = event.target.value)}
                      disabled={this.configLoading || this.configSaving}
                    />
                  </label>
                </div>

              </section>

              <section className="AdSlotAdminConfigSection">
                <div className="AdSlotAdminConfigSection-head">
                  <div>
                    <h4>优惠码用户组</h4>
                    <p>选择哪些用户组可在前台生成优惠码。</p>
                  </div>
                  {Button.component(
                    {
                      type: 'button',
                      className: 'Button Button--primary AdSlotAdminPrimaryButton',
                      loading: this.configSavingModule === 'groups',
                      onclick: () => this.saveGroupConfig(),
                      disabled: this.configLoading || this.configSaving,
                    },
                    '保存用户组设置'
                  )}
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
              </section>

              <section className={`AdSlotAdminConfigSection${this.isConfigSectionExpanded('notice') ? ' is-expanded' : ' is-collapsed'}`}>
                <div className="AdSlotAdminConfigSection-head">
                  <div>
                    <h4>前台顶部公告栏</h4>
                    <p>控制商家合作页顶部公告是否展示及文案内容。</p>
                  </div>
                  <div className="AdSlotAdminConfigSection-headActions">
                    {Button.component(
                      {
                        type: 'button',
                        className: 'Button AdSlotAdminGhostButton',
                        icon: this.isConfigSectionExpanded('notice') ? 'fas fa-chevron-up' : 'fas fa-chevron-down',
                        onclick: () => this.toggleConfigSection('notice'),
                        disabled: this.configLoading || this.configSaving,
                      },
                      this.isConfigSectionExpanded('notice') ? '收起' : '展开'
                    )}
                    {this.isConfigSectionExpanded('notice')
                      ? Button.component(
                          {
                            type: 'button',
                            className: 'Button Button--primary AdSlotAdminPrimaryButton',
                            loading: this.configSavingModule === 'notice',
                            onclick: () => this.saveNoticeConfig(),
                            disabled: this.configLoading || this.configSaving,
                          },
                          '保存公告设置'
                        )
                      : null}
                  </div>
                </div>

                {this.isConfigSectionExpanded('notice') ? (
                  <div className="AdSlotAdminNoticeConfig">
                    <label className="checkbox AdSlotAdminNoticeToggle">
                      <input
                        type="checkbox"
                        checked={this.config.noticeBarEnabled}
                        onchange={(event) => (this.config.noticeBarEnabled = event.target.checked)}
                        disabled={this.configLoading || this.configSaving}
                      />
                      启用前台顶部公告栏
                    </label>

                    <label className="AdSlotAdminField AdSlotAdminField--noticeText">
                      <span>公告内容</span>
                      <textarea
                        className="FormControl"
                        maxlength="2000"
                        rows="4"
                        value={this.config.noticeBarText}
                        oninput={(event) => (this.config.noticeBarText = event.target.value)}
                        disabled={this.configLoading || this.configSaving}
                        placeholder="活动即将到来"
                      ></textarea>
                    </label>

                    <div className="AdSlotAdminNoticePreview">
                      <div className="ActHubNoticeBar-inner">
                        <i aria-hidden="true" className="icon fas fa-bullhorn ActHubNoticeBar-icon"></i>
                        <div className="ActHubNoticeBar-body">{m.trust(this.config.noticeBarText || '活动即将到来')}</div>
                      </div>
                    </div>
                  </div>
                ) : null}
              </section>

              <section className={`AdSlotAdminConfigSection${this.isConfigSectionExpanded('payment') ? ' is-expanded' : ' is-collapsed'}`}>
                <div className="AdSlotAdminConfigSection-head">
                  <div>
                    <h4>支付引导</h4>
                    <p>用于前台申请弹窗中说明付款方式。用户会先看到付款信息，再上传支付凭证。</p>
                  </div>
                  <div className="AdSlotAdminConfigSection-headActions">
                    {Button.component(
                      {
                        type: 'button',
                        className: 'Button AdSlotAdminGhostButton',
                        icon: this.isConfigSectionExpanded('payment') ? 'fas fa-chevron-up' : 'fas fa-chevron-down',
                        onclick: () => this.toggleConfigSection('payment'),
                        disabled: this.configLoading || this.configSaving,
                      },
                      this.isConfigSectionExpanded('payment') ? '收起' : '展开'
                    )}
                    {this.isConfigSectionExpanded('payment')
                      ? Button.component(
                          {
                            type: 'button',
                            className: 'Button Button--primary AdSlotAdminPrimaryButton',
                            loading: this.configSavingModule === 'payment',
                            onclick: () => this.savePaymentConfig(),
                            disabled: this.configLoading || this.configSaving,
                          },
                          '保存支付引导'
                        )
                      : null}
                  </div>
                </div>

                {this.isConfigSectionExpanded('payment') ? (
                  <div>
                    <div className="AdSlotAdminNoticeConfig">
                      <label className="checkbox AdSlotAdminNoticeToggle">
                        <input
                          type="checkbox"
                          checked={this.config.paymentGuideEnabled}
                          onchange={(event) => (this.config.paymentGuideEnabled = event.target.checked)}
                          disabled={this.configLoading || this.configSaving}
                        />
                        启用前台支付引导
                      </label>
                    </div>

                    <div className="AdSlotAdminPaymentConfig">
                      <label className="AdSlotAdminField">
                        <span>引导标题</span>
                        <input
                          className="FormControl"
                          type="text"
                          value={this.config.paymentGuideTitle}
                          oninput={(event) => (this.config.paymentGuideTitle = event.target.value)}
                          disabled={this.configLoading || this.configSaving}
                          placeholder="支付方式"
                        />
                      </label>

                      <label className="AdSlotAdminField AdSlotAdminField--full">
                        <span>引导说明</span>
                        <textarea
                          className="FormControl"
                          maxlength="2000"
                          rows="3"
                          value={this.config.paymentGuideText}
                          oninput={(event) => (this.config.paymentGuideText = event.target.value)}
                          disabled={this.configLoading || this.configSaving}
                          placeholder="请先按以下收款信息完成转账，支付成功后再上传支付凭证。"
                        ></textarea>
                      </label>

                      <label className="AdSlotAdminField">
                        <span>微信收款账号</span>
                        <input
                          className="FormControl"
                          type="text"
                          value={this.config.paymentWechatAccount}
                          oninput={(event) => (this.config.paymentWechatAccount = event.target.value)}
                          disabled={this.configLoading || this.configSaving}
                          placeholder="例如：微信号 / 收款备注名"
                        />
                      </label>

                      {this.renderPaymentQrUploadField('wechat', '微信收款码', this.config.paymentWechatQrCodeUrl)}

                      <label className="AdSlotAdminField AdSlotAdminField--full">
                        <span>微信说明</span>
                        <textarea
                          className="FormControl"
                          maxlength="2000"
                          rows="3"
                          value={this.config.paymentWechatNote}
                          oninput={(event) => (this.config.paymentWechatNote = event.target.value)}
                          disabled={this.configLoading || this.configSaving}
                          placeholder="支持微信扫码或转账付款。"
                        ></textarea>
                      </label>

                      <label className="AdSlotAdminField">
                        <span>支付宝收款账号</span>
                        <input
                          className="FormControl"
                          type="text"
                          value={this.config.paymentAlipayAccount}
                          oninput={(event) => (this.config.paymentAlipayAccount = event.target.value)}
                          disabled={this.configLoading || this.configSaving}
                          placeholder="例如：支付宝账号 / 收款姓名"
                        />
                      </label>

                      {this.renderPaymentQrUploadField('alipay', '支付宝收款码', this.config.paymentAlipayQrCodeUrl)}

                      <label className="AdSlotAdminField AdSlotAdminField--full">
                        <span>支付宝说明</span>
                        <textarea
                          className="FormControl"
                          maxlength="2000"
                          rows="3"
                          value={this.config.paymentAlipayNote}
                          oninput={(event) => (this.config.paymentAlipayNote = event.target.value)}
                          disabled={this.configLoading || this.configSaving}
                          placeholder="支持支付宝扫码或转账付款。"
                        ></textarea>
                      </label>

                      <label className="AdSlotAdminField">
                        <span>USDT 地址</span>
                        <input
                          className="FormControl"
                          type="text"
                          value={this.config.paymentUsdtAccount}
                          oninput={(event) => (this.config.paymentUsdtAccount = event.target.value)}
                          disabled={this.configLoading || this.configSaving}
                          placeholder="例如：TRC20 钱包地址"
                        />
                      </label>

                      {this.renderPaymentQrUploadField('usdt', 'USDT 收款码', this.config.paymentUsdtQrCodeUrl)}

                      <label className="AdSlotAdminField AdSlotAdminField--full">
                        <span>USDT 说明</span>
                        <textarea
                          className="FormControl"
                          maxlength="2000"
                          rows="3"
                          value={this.config.paymentUsdtNote}
                          oninput={(event) => (this.config.paymentUsdtNote = event.target.value)}
                          disabled={this.configLoading || this.configSaving}
                          placeholder="仅支持 USDT 转账，请确认链类型和地址无误。"
                        ></textarea>
                      </label>

                      <label className="AdSlotAdminField AdSlotAdminField--full">
                        <span>通用补充说明</span>
                        <textarea
                          className="FormControl"
                          maxlength="2000"
                          rows="3"
                          value={this.config.paymentExtraText}
                          oninput={(event) => (this.config.paymentExtraText = event.target.value)}
                          disabled={this.configLoading || this.configSaving}
                          placeholder="完成付款后，请上传包含金额、时间和收款方信息的转账截图。"
                        ></textarea>
                      </label>
                    </div>
                  </div>
                ) : null}
              </section>

            </div>

            {this.configLoading ? (
              <div className="AdSlotAdminPage-notice">
                <LoadingIndicator display="inline" size="small" /> 正在加载配置...
              </div>
            ) : null}
            {this.configError ? <div className="AdSlotAdminPage-error">{this.configError}</div> : null}
          </div>
        </div>

        <div className="AdSlotAdminPage-shell">
          <div className="AdSlotAdminCard AdSlotAdminCard--table">
            <div className="AdSlotAdminCard-head">
              <div>
                <h3>审核列表</h3>
                <p>首页展示最近 10 条商家数据，减少后台首页信息拥挤；完整审核列表进入更多页面处理。</p>
              </div>
              <div className="AdSlotAdminCard-headActions">
                {this.renderReviewFilters()}
                <LinkButton className="Button AdSlotAdminGhostButton" href={app.route('adslotReviews')} icon="fas fa-table-list">
                  更多审核数据
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

  renderPaymentQrUploadField(method, label, value) {
    const uploading = !!this.paymentQrUploading?.[method];
    const disabled = this.configLoading || this.configSaving || uploading;

    return (
      <div className="AdSlotAdminField AdSlotAdminQrUploadField">
        <span>{label}</span>
        <label className={`AdSlotAdminUploadCard${uploading ? ' is-uploading' : ''}`}>
          <input
            className="AdSlotAdminUploadInput"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onchange={(event) => this.onPaymentQrFileChange(method, event)}
            disabled={disabled}
          />
          <div className="AdSlotAdminUploadCard-main">
            <div className="AdSlotAdminUploadIcon">
              <i className="fas fa-qrcode" aria-hidden="true"></i>
            </div>
            <div className="AdSlotAdminUploadText">
              <strong>{uploading ? '正在上传收款码...' : value ? '重新上传收款码' : '点击上传收款码'}</strong>
              <span>支持 PNG / JPG / WEBP，上传后前台将直接展示该图片</span>
            </div>
          </div>
        </label>

        {value ? (
          <div className="AdSlotAdminUploadPreviewGroup">
            <div className="AdSlotAdminUploadPreview">
              <img src={value} alt={label} />
            </div>
            <div className="AdSlotAdminUploadActions">
              {Button.component(
                {
                  type: 'button',
                  className: 'Button AdSlotAdminGhostButton',
                  onclick: () => this.clearPaymentQrImage(method),
                  disabled,
                },
                '清空图片'
              )}
            </div>
          </div>
        ) : null}

        <p className="AdSlotAdminUploadHint">建议上传清晰的方形收款码图片，保存支付引导设置后才会在前台生效。</p>
      </div>
    );
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
      this.broadcastRuntimeConfigRefresh();

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
      this.broadcastRuntimeConfigRefresh();

      const data = response.data || {};
      this.config = {
        baseMonthlyFee: String(data.baseMonthlyFee ?? ''),
        defaultDiscountAmount: String(data.defaultDiscountAmount ?? ''),
        defaultDiscountValidDays: String(data.defaultDiscountValidDays ?? ''),
        personalDiscountCodeLimit: String(data.personalDiscountCodeLimit ?? 1),
        discountEnabledGroupIds: data.discountEnabledGroupIds || [],
        noticeBarEnabled: data.noticeBarEnabled !== false,
        noticeBarText: String(data.noticeBarText || '活动即将到来'),
        paymentGuideEnabled: data.paymentGuideEnabled !== false,
        paymentGuideTitle: String(data.paymentGuideTitle || '支付方式'),
        paymentGuideText: String(data.paymentGuideText || '请先按以下收款信息完成转账，支付成功后再上传支付凭证。'),
        paymentExtraText: String(data.paymentExtraText || '完成付款后，请上传包含金额、时间和收款方信息的转账截图。'),
        paymentWechatAccount: String(data.paymentWechatAccount || ''),
        paymentWechatQrCodeUrl: String(data.paymentWechatQrCodeUrl || ''),
        paymentWechatNote: String(data.paymentWechatNote || '支持微信扫码或转账付款。'),
        paymentAlipayAccount: String(data.paymentAlipayAccount || ''),
        paymentAlipayQrCodeUrl: String(data.paymentAlipayQrCodeUrl || ''),
        paymentAlipayNote: String(data.paymentAlipayNote || '支持支付宝扫码或转账付款。'),
        paymentUsdtAccount: String(data.paymentUsdtAccount || ''),
        paymentUsdtQrCodeUrl: String(data.paymentUsdtQrCodeUrl || ''),
        paymentUsdtNote: String(data.paymentUsdtNote || '仅支持 USDT 转账，请确认链类型和地址无误。'),
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
      {
        baseMonthlyFee: Number(this.config.baseMonthlyFee || 0),
        defaultDiscountAmount: Number(this.config.defaultDiscountAmount || 0),
        defaultDiscountValidDays: Number(this.config.defaultDiscountValidDays || 0),
        personalDiscountCodeLimit: Number(this.config.personalDiscountCodeLimit || 1),
      },
      '费用与优惠码设置已保存。',
      'fees'
    );
  }

  saveNoticeConfig() {
    return this.saveConfig(
      {
        noticeBarEnabled: !!this.config.noticeBarEnabled,
        noticeBarText: this.config.noticeBarText || '活动即将到来',
      },
      '公告栏设置已保存。',
      'notice'
    );
  }

  savePaymentConfig() {
    return this.saveConfig(
      {
        paymentGuideEnabled: !!this.config.paymentGuideEnabled,
        paymentGuideTitle: this.config.paymentGuideTitle || '支付方式',
        paymentGuideText: this.config.paymentGuideText || '请先按以下收款信息完成转账，支付成功后再上传支付凭证。',
        paymentExtraText: this.config.paymentExtraText || '完成付款后，请上传包含金额、时间和收款方信息的转账截图。',
        paymentWechatAccount: this.config.paymentWechatAccount || '',
        paymentWechatQrCodeUrl: this.config.paymentWechatQrCodeUrl || '',
        paymentWechatNote: this.config.paymentWechatNote || '支持微信扫码或转账付款。',
        paymentAlipayAccount: this.config.paymentAlipayAccount || '',
        paymentAlipayQrCodeUrl: this.config.paymentAlipayQrCodeUrl || '',
        paymentAlipayNote: this.config.paymentAlipayNote || '支持支付宝扫码或转账付款。',
        paymentUsdtAccount: this.config.paymentUsdtAccount || '',
        paymentUsdtQrCodeUrl: this.config.paymentUsdtQrCodeUrl || '',
        paymentUsdtNote: this.config.paymentUsdtNote || '仅支持 USDT 转账，请确认链类型和地址无误。',
      },
      '支付引导设置已保存。',
      'payment'
    );
  }

  saveGroupConfig() {
    return this.saveConfig(
      {
        discountEnabledGroupIds: this.config.discountEnabledGroupIds,
      },
      '优惠码用户组设置已保存。',
      'groups'
    );
  }

  async saveConfig(attributes, successMessage = '配置已保存。', module = '') {
    this.configSaving = true;
    this.configSavingModule = module;
    this.configError = '';
    this.configNotice = '';
    this.redrawNow();

    try {
      await app.request({
        method: 'POST',
        url: `${this.apiUrl()}/adslot/admin/config`,
        body: {
          data: {
            attributes,
          },
        },
      });

      this.showAlert('success', successMessage);
    } catch (error) {
      this.showAlert('error', error.message || '配置保存失败');
    }

    this.configSaving = false;
    this.configSavingModule = '';
    this.redrawNow();
  }

  showAlert(type, message) {
    if (app.alerts && typeof app.alerts.show === 'function') {
      app.alerts.show({ type }, message);
      return;
    }

    if (type === 'error') {
      this.configError = message;
      return;
    }

    this.configNotice = message;
  }

  broadcastRuntimeConfigRefresh() {
    if (typeof window === 'undefined' || !window.localStorage) {
      return;
    }

    try {
      window.localStorage.setItem(
        'doingfb-adslot.runtime-config-updated-at',
        JSON.stringify({
          updatedAt: new Date().toISOString(),
        })
      );
    } catch (_error) {
    }
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
    this.redrawNow();

    try {
      const response = await app.request({
        method: 'POST',
        url: `${this.apiUrl()}/adslot/discount-codes/generate`,
        body: {
          data: {
            attributes: {
              amount: Number(this.config.defaultDiscountAmount || 0),
              validDays: Number(this.config.defaultDiscountValidDays || 0),
              quantity: 1,
            },
          },
        },
      });

      this.generatedAdminCode = response.data || null;
      this.showAlert('success', '后台优惠码已生成。');
    } catch (error) {
      this.showAlert('error', error.message || '优惠码生成失败');
    }

    this.codeGenerating = false;
    this.redrawNow();
  }

  openEditModal(item) {
    app.modal.show(EditItemModal, {
      item,
      onsaved: () => this.loadRecentItems(),
    });
  }

  async quickUpdate(id, attributes) {
    await app.request({
      method: 'POST',
      url: `${this.apiUrl()}/adslot/admin/items/update`,
      body: { data: { id, attributes } },
    });

    this.loadRecentItems();
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

    await app.request({
      method: 'POST',
      url: `${this.apiUrl()}/adslot/admin/items/delete`,
      body: { data: { id } },
    });

    this.loadRecentItems();
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

  paymentQrFieldName(method) {
    const fieldMap = {
      wechat: 'paymentWechatQrCodeUrl',
      alipay: 'paymentAlipayQrCodeUrl',
      usdt: 'paymentUsdtQrCodeUrl',
    };

    return fieldMap[method] || '';
  }

  paymentMethodLabel(method) {
    const labelMap = {
      wechat: '微信',
      alipay: '支付宝',
      usdt: 'USDT',
    };

    return labelMap[method] || '收款码';
  }

  async onPaymentQrFileChange(method, event) {
    const file = event.target.files?.[0] || null;
    event.target.value = '';

    if (!file) {
      return;
    }

    await this.uploadPaymentQrImage(method, file);
  }

  async uploadPaymentQrImage(method, file) {
    const field = this.paymentQrFieldName(method);

    if (!field) {
      return;
    }

    this.paymentQrUploading = {
      ...this.paymentQrUploading,
      [method]: true,
    };
    this.redrawNow();

    try {
      const body = new FormData();
      body.append('image', file);
      body.append('kind', 'payment-proof');

      const response = await app.request({
        method: 'POST',
        url: `${this.apiUrl()}/adslot/upload-image`,
        serialize: (raw) => raw,
        body,
      });

      const path = response?.data?.path || response?.data?.url || '';

      if (!path) {
        throw new Error('收款码上传失败');
      }

      this.config[field] = path;
      this.showAlert('success', `${this.paymentMethodLabel(method)}收款码已上传，记得保存支付引导设置。`);
    } catch (error) {
      this.showAlert('error', error.message || '收款码上传失败');
    }

    this.paymentQrUploading = {
      ...this.paymentQrUploading,
      [method]: false,
    };
    this.redrawNow();
  }

  clearPaymentQrImage(method) {
    const field = this.paymentQrFieldName(method);

    if (!field) {
      return;
    }

    this.config[field] = '';
    this.redrawNow();
  }

  apiUrl() {
    return (app.forum && app.forum.attribute('apiUrl')) || app.data?.apiUrl || '';
  }
}
