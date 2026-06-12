import app from 'flarum/forum/app';
import Modal from 'flarum/common/components/Modal';
import Button from 'flarum/common/components/Button';

const CONTACT_OPTIONS = [
  { value: 'wechat', label: '微信' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'email', label: '邮箱' },
];

const CONTACT_PLACEHOLDERS = {
  wechat: '请输入微信号',
  telegram: '请输入 @username',
  email: '请输入邮箱地址',
};

const DURATION_OPTIONS = [
  { value: 1, label: '1个月' },
  { value: 3, label: '3个月' },
  { value: 6, label: '6个月' },
  { value: 12, label: '12个月' },
];

const RUNTIME_CONFIG_REFRESH_EVENT_KEY = 'doingfb-adslot.runtime-config-updated-at';

export default class ApplyModal extends Modal {
  oninit(vnode) {
    super.oninit(vnode);

    this.mode = this.attrs.mode || 'create';
    this.sourceItem = this.attrs.item || null;
    this.submitting = false;
    this.uploading = false;
    this.generatingCode = false;
    this.error = '';
    this.form = {
      merchantName: '',
      imagePath: '',
      targetUrl: '',
      contactType: 'wechat',
      contactValue: '',
      discountCode: '',
      paymentProofPath: '',
      durationMonths: 1,
    };

    this.imageFile = null;
    this.paymentProofFile = null;
    this.previewUrl = '';
    this.paymentProofPreviewUrl = '';
    this.fileInput = null;
    this.paymentProofInput = null;
    this.generatedDiscount = null;
    this.discountPreview = null;
    this.discountPreviewLoading = false;
    this.discountPreviewTimer = null;
    this.discountPreviewRequestKey = '';
    this.runtimeConfigRefreshTimer = null;
    this.boundRuntimeConfigRefresh = () => this.loadRuntimeConfig(true);
    this.boundRuntimeConfigStorageSync = (event) => {
      if (event.key === RUNTIME_CONFIG_REFRESH_EVENT_KEY) {
        this.loadRuntimeConfig(true);
      }
    };
    const initialRuntimeConfig = this.attrs.runtimeConfig || {};
    const forumBaseMonthlyFee = app.forum.attribute('doingfb-adslot.baseMonthlyFee');
    const forumDefaultDiscountAmount = app.forum.attribute('doingfb-adslot.defaultDiscountAmount');
    const forumDefaultDiscountValidDays = app.forum.attribute('doingfb-adslot.defaultDiscountValidDays');
    const forumCanGenerateDiscountCode = app.forum.attribute('doingfb-adslot.canGenerateDiscountCode');
    this.paymentGuideExpanded = false;

    this.runtimeConfig = {
      baseMonthlyFee: Number(initialRuntimeConfig.baseMonthlyFee ?? forumBaseMonthlyFee ?? 0),
      defaultDiscountAmount: Number(initialRuntimeConfig.defaultDiscountAmount ?? forumDefaultDiscountAmount ?? 0),
      defaultDiscountValidDays: Number(initialRuntimeConfig.defaultDiscountValidDays ?? forumDefaultDiscountValidDays ?? 0),
      canGenerateDiscountCode: initialRuntimeConfig.canGenerateDiscountCode ?? !!forumCanGenerateDiscountCode,
      paymentGuideEnabled: initialRuntimeConfig.paymentGuideEnabled !== false,
      paymentGuideTitle: String(initialRuntimeConfig.paymentGuideTitle || app.forum.attribute('doingfb-adslot.paymentGuideTitle') || '支付方式'),
      paymentGuideText: String(
        initialRuntimeConfig.paymentGuideText ||
          app.forum.attribute('doingfb-adslot.paymentGuideText') ||
          '请先按以下收款信息完成转账，支付成功后再上传支付凭证。'
      ),
      paymentExtraText: String(
        initialRuntimeConfig.paymentExtraText ||
          app.forum.attribute('doingfb-adslot.paymentExtraText') ||
          '完成付款后，请上传包含金额、时间和收款方信息的转账截图。'
      ),
      paymentWechatAccount: String(initialRuntimeConfig.paymentWechatAccount || app.forum.attribute('doingfb-adslot.paymentWechatAccount') || ''),
      paymentWechatQrCodeUrl: String(initialRuntimeConfig.paymentWechatQrCodeUrl || app.forum.attribute('doingfb-adslot.paymentWechatQrCodeUrl') || ''),
      paymentWechatNote: String(initialRuntimeConfig.paymentWechatNote || app.forum.attribute('doingfb-adslot.paymentWechatNote') || '支持微信扫码或转账付款。'),
      paymentAlipayAccount: String(initialRuntimeConfig.paymentAlipayAccount || app.forum.attribute('doingfb-adslot.paymentAlipayAccount') || ''),
      paymentAlipayQrCodeUrl: String(initialRuntimeConfig.paymentAlipayQrCodeUrl || app.forum.attribute('doingfb-adslot.paymentAlipayQrCodeUrl') || ''),
      paymentAlipayNote: String(initialRuntimeConfig.paymentAlipayNote || app.forum.attribute('doingfb-adslot.paymentAlipayNote') || '支持支付宝扫码或转账付款。'),
      paymentUsdtAccount: String(initialRuntimeConfig.paymentUsdtAccount || app.forum.attribute('doingfb-adslot.paymentUsdtAccount') || ''),
      paymentUsdtQrCodeUrl: String(initialRuntimeConfig.paymentUsdtQrCodeUrl || app.forum.attribute('doingfb-adslot.paymentUsdtQrCodeUrl') || ''),
      paymentUsdtNote: String(initialRuntimeConfig.paymentUsdtNote || app.forum.attribute('doingfb-adslot.paymentUsdtNote') || '仅支持 USDT 转账，请确认链类型和地址无误。'),
    };

    this.applySourceItem();
  }

  oncreate(vnode) {
    super.oncreate(vnode);

    const runtimeConfigPromise = this.attrs.runtimeConfigPromise;
    if (runtimeConfigPromise && typeof runtimeConfigPromise.then === 'function') {
      runtimeConfigPromise.then((runtimeConfig) => this.applyRuntimeConfig(runtimeConfig));
    } else {
      this.loadRuntimeConfig(true);
    }

    window.addEventListener('focus', this.boundRuntimeConfigRefresh);
    window.addEventListener('storage', this.boundRuntimeConfigStorageSync);
    document.addEventListener('visibilitychange', this.boundRuntimeConfigRefresh);
    this.runtimeConfigRefreshTimer = window.setInterval(() => this.loadRuntimeConfig(), 60000);
    this.syncPaymentProofCopy(vnode.dom);
  }

  onupdate(vnode) {
    super.onupdate?.(vnode);
    this.syncPaymentProofCopy(vnode.dom);
  }

  className() {
    return 'AdSlotApplyModal Modal--large';
  }

  title() {
    if (this.mode === 'edit') {
      return '修改广告申请';
    }

    if (this.mode === 'renew') {
      return '广告续费申请';
    }

    return '申请商家展示';
  }

  content() {
    return (
      <div className="Modal-body">
        <form className="Form AdSlotForm" onsubmit={(event) => this.submit(event)}>
          <div className="AdSlotApplyIntro">
            <div className="AdSlotApplyIntro-copy">
              <strong>{this.introTitle()}</strong>
              <p>{this.introText()}</p>
            </div>
            <div className="AdSlotApplyIntro-badge">推荐 800 x 800</div>
          </div>

          {this.isRenewMode() ? (
            <div className="AdSlotRenewEditNotice">
              <strong>续费可修改项</strong>
              <span>本次续费可修改联系方式类型、联系方式账号、投放时长、优惠码和支付凭证；商家名称、广告图、跳转链接等原广告信息会保持不变。</span>
            </div>
          ) : null}

          <div className={this.lockedFieldClass()}>
            <label htmlFor="adslot-merchant-name">商家名称</label>
            <input
              id="adslot-merchant-name"
              className="FormControl"
              placeholder="例如：XXX 商家"
              value={this.form.merchantName}
              oninput={(event) => (this.form.merchantName = event.target.value)}
              disabled={this.isBusy() || this.isRenewMode()}
            />
            {this.renderLockedHint()}
          </div>

          <div className={this.lockedFieldClass()}>
            <label>广告图</label>
            <label className={`AdSlotUploadCard${this.isRenewMode() ? ' is-disabled' : ''}`}>
              <input
                className="AdSlotUploadInput"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                oncreate={(vnode) => (this.fileInput = vnode.dom)}
                onupdate={(vnode) => (this.fileInput = vnode.dom)}
                onchange={(event) => this.onAdImageChange(event)}
                disabled={this.isBusy() || this.isRenewMode()}
              />
              <div className="AdSlotUploadCard-main">
                <div className="AdSlotUploadIcon">
                  <i className="fas fa-image" aria-hidden="true"></i>
                </div>
                <div className="AdSlotUploadText">
                  <strong>{this.previewUrl ? '重新选择广告图' : '点击上传广告图'}</strong>
                  <span>支持 PNG / JPG / WEBP，建议使用横纵比例一致的图片</span>
                </div>
              </div>
            </label>
            <p className="helpText AdSlotUploadHint">建议上传横纵比例一致的展示图，推荐 800 x 800 或更高分辨率，以获得更稳定的展示效果。</p>
            {this.previewUrl ? (
              <div className="AdSlotUploadPreviewGroup">
                <div className="AdSlotUploadPreview AdSlotUploadPreview--large">
                  <img src={this.previewUrl} alt="preview" />
                </div>
                {Button.component(
                  {
                    type: 'button',
                    className: 'Button',
                    onclick: () => this.clearAdImage(),
                    disabled: this.isBusy() || this.isRenewMode(),
                  },
                  this.form.imagePath && !this.imageFile ? '清空图片' : '删除图片'
                )}
              </div>
            ) : null}
            {this.renderLockedHint()}
          </div>

          <div className={this.lockedFieldClass()}>
            <label htmlFor="adslot-target-url">跳转链接</label>
            <input
              id="adslot-target-url"
              className="FormControl"
              placeholder="https://"
              value={this.form.targetUrl}
              oninput={(event) => (this.form.targetUrl = event.target.value)}
              disabled={this.isBusy() || this.isRenewMode()}
            />
            {this.renderLockedHint()}
          </div>

          <div className="AdSlotApplyGrid">
            <div className="Form-group">
              <label htmlFor="adslot-contact-type">联系方式类型</label>
              <select
                id="adslot-contact-type"
                className="FormControl"
                value={this.form.contactType}
                onchange={(event) => this.onContactTypeChange(event)}
                disabled={this.isBusy()}
              >
                {CONTACT_OPTIONS.map((option) => (
                  <option value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="Form-group">
              <label htmlFor="adslot-contact-value">联系方式账号</label>
              <input
                id="adslot-contact-value"
                className="FormControl"
                placeholder={this.contactPlaceholder()}
                value={this.form.contactValue}
                oninput={(event) => (this.form.contactValue = event.target.value)}
                disabled={this.isBusy()}
              />
            </div>
          </div>

          <div className="AdSlotApplyGrid">
            <div className="Form-group">
              <label htmlFor="adslot-duration-months">投放时长</label>
              <select
                id="adslot-duration-months"
                className="FormControl"
                value={String(this.form.durationMonths)}
                onchange={(event) => this.onDurationChange(event)}
                disabled={this.isBusy()}
              >
                {DURATION_OPTIONS.map((option) => (
                  <option value={String(option.value)}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="Form-group">
              <label>广告费说明</label>
              <input
                className="FormControl"
                value={`${this.formatMoney(this.baseMonthlyFee())} / 月`}
                disabled
              />
            </div>
          </div>

          <div className="Form-group">
            <label htmlFor="adslot-discount-code">优惠码</label>
            <div className="AdSlotInlineField">
              <input
                id="adslot-discount-code"
                className="FormControl"
                placeholder="选填，没有可以留空"
                value={this.form.discountCode}
                oninput={(event) => this.onDiscountCodeInput(event)}
                disabled={this.isBusy()}
              />
              {this.canGenerateDiscountCode()
                ? Button.component(
                    {
                      type: 'button',
                      className: 'Button',
                      onclick: () => this.generateDiscountCode(),
                      loading: this.generatingCode,
                      disabled: this.isBusy(),
                    },
                    '生成优惠码'
                  )
                : null}
            </div>
            <p className="helpText AdSlotDiscountHint">
              选填。部分后台优惠码会限制适用投放时长，系统会在输入后自动校验；优惠码抵扣金额与有效期在生成时确定，到期日按亚洲/上海时间 23:59 截止。
            </p>
            {this.discountPreviewNotice() ? (
              <p className={`helpText AdSlotDiscountHint${this.currentDiscountPreview()?.isApplicable ? ' is-success' : ' is-warning'}`}>
                {this.discountPreviewNotice()}
              </p>
            ) : null}
          </div>

          <div className="AdSlotFeePanel">
            <div className="AdSlotFeePanel-row">
              <span>月单价</span>
              <strong>{this.formatMoney(this.baseMonthlyFee())}</strong>
            </div>
            <div className="AdSlotFeePanel-row">
              <span>投放时长</span>
              <strong>{this.formatDurationMonths(this.form.durationMonths)}</strong>
            </div>
            <div className="AdSlotFeePanel-row">
              <span>广告费小计</span>
              <strong>{this.formatMoney(this.adFeeAmount())}</strong>
            </div>
            <div className="AdSlotFeePanel-row">
              <span>优惠抵扣</span>
              <strong className="is-discount">-{this.formatMoney(this.discountAmount())}</strong>
            </div>
            <div className="AdSlotFeePanel-row is-total">
              <span>应付金额</span>
              <strong>{this.formatMoney(this.payableAmount())}</strong>
            </div>
            <p className="helpText AdSlotDiscountHint">
              计费方式：{this.formatMoney(this.baseMonthlyFee())} / 月 x {this.form.durationMonths} = {this.formatMoney(this.adFeeAmount())}
            </p>
            {this.generatedDiscountNotice() ? <p className="helpText AdSlotDiscountHint">{this.generatedDiscountNotice()}</p> : null}
            {this.renderPaymentGuide()}
          </div>

          <div className="Form-group">
            <label>支付凭证</label>
            <label className="AdSlotUploadCard">
              <input
                className="AdSlotUploadInput"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                oncreate={(vnode) => (this.paymentProofInput = vnode.dom)}
                onupdate={(vnode) => (this.paymentProofInput = vnode.dom)}
                onchange={(event) => this.onPaymentProofChange(event)}
                disabled={this.isBusy()}
              />
              <div className="AdSlotUploadCard-main">
                <div className="AdSlotUploadIcon">
                  <i className="fas fa-receipt" aria-hidden="true"></i>
                </div>
                <div className="AdSlotUploadText">
                  <strong>{this.paymentProofPreviewUrl ? '重新选择支付凭证' : '点击上传支付凭证'}</strong>
                  <span>支持 PNG / JPG / WEBP，用于后台核对本次支付</span>
                </div>
              </div>
            </label>
            <p className="helpText AdSlotUploadHint">
              {this.payableAmount() > 0
                ? '当前应付金额大于 0 时需要上传支付凭证；如本次已被全部抵扣，可按后台审核规则处理。'
                : '当前应付金额为 0，可不上传支付凭证，由后台审核规则决定。'}
            </p>
            {this.paymentProofPreviewUrl ? (
              <div className="AdSlotUploadPreviewGroup">
                <div className="AdSlotUploadPreview AdSlotUploadPreview--wide">
                  <img src={this.paymentProofPreviewUrl} alt="payment-proof-preview" />
                </div>
                {Button.component(
                  {
                    type: 'button',
                    className: 'Button',
                    onclick: () => this.clearPaymentProof(),
                    disabled: this.isBusy(),
                  },
                  '删除凭证'
                )}
              </div>
            ) : null}
          </div>

          {this.error ? (
            <div className="Alert Alert--error">
              <span className="Alert-body">{this.error}</span>
            </div>
          ) : null}

          <div className="AdSlotActions">
            {Button.component(
              {
                type: 'button',
                className: 'Button',
                onclick: () => this.hide(),
                disabled: this.isBusy(),
              },
              '取消'
            )}
            {Button.component(
              {
                type: 'submit',
                className: 'Button Button--primary',
                loading: this.submitting || this.uploading,
              },
              this.submitButtonText()
            )}
          </div>
        </form>
      </div>
    );
  }

  isBusy() {
    return this.submitting || this.uploading || this.generatingCode;
  }

  isRenewMode() {
    return this.mode === 'renew' && !!this.sourceItem?.id;
  }

  lockedFieldClass() {
    return `Form-group${this.isRenewMode() ? ' AdSlotRenewLockedField' : ''}`;
  }

  renderLockedHint() {
    return this.isRenewMode() ? <p className="helpText AdSlotRenewLockedHint">续费不可修改，审核通过后将沿用原广告信息。</p> : null;
  }

  baseMonthlyFee() {
    return Number(this.runtimeConfig.baseMonthlyFee || 0);
  }

  adFeeAmount() {
    return Number((this.baseMonthlyFee() * Number(this.form.durationMonths || 1)).toFixed(2));
  }

  canGenerateDiscountCode() {
    return !!this.runtimeConfig.canGenerateDiscountCode;
  }

  discountAmount() {
    if (!this.form.discountCode.trim()) {
      return 0;
    }

    const preview = this.currentDiscountPreview();

    if (preview) {
      return preview.isApplicable ? Math.min(this.adFeeAmount(), Number(preview.discountAmount || preview.amount || 0)) : 0;
    }

    if (this.generatedDiscount && this.generatedDiscount.code === this.form.discountCode.trim()) {
      const restrictedDuration = Number(this.generatedDiscount.durationMonths || 0);

      if (restrictedDuration && restrictedDuration !== Number(this.form.durationMonths || 1)) {
        return 0;
      }

      return Math.min(this.adFeeAmount(), Number(this.generatedDiscount.amount || 0));
    }

    return 0;
  }

  payableAmount() {
    return Math.max(0, Number((this.adFeeAmount() - this.discountAmount()).toFixed(2)));
  }

  renderPaymentGuide() {
    if (this.payableAmount() <= 0 || !this.runtimeConfig.paymentGuideEnabled) {
      return null;
    }

    const hasGuide = this.paymentMethodsForDom().length > 0;

    return (
      <div className={`AdSlotPaymentGuide${hasGuide ? '' : ' is-missing'}`}></div>
    );
  }

  generatedDiscountNotice() {
    if (!this.generatedDiscount || this.generatedDiscount.code !== this.form.discountCode.trim()) {
      return '';
    }

    const amount = this.formatMoney(this.generatedDiscount.amount || 0);
    const startsAt = this.formatDateTime(this.generatedDiscount.startsAt);
    const expiresAt = this.formatDateTime(this.generatedDiscount.expiresAt);
    const validDays = Number(this.generatedDiscount.validDays || this.generatedDiscountValidDays());
    const durationText = this.durationRestrictionLabel(this.generatedDiscount.durationMonths);

    return `当前优惠码固定可抵扣 ${amount}，适用范围：${durationText}；生成时间 ${startsAt}，有效期至 ${expiresAt}（亚洲/上海时间）。有效期按后台设置的 ${validDays} 天计算，并在到期日 23:59 截止。`;
  }

  currentDiscountPreview() {
    const code = this.form.discountCode.trim();
    const durationMonths = Number(this.form.durationMonths || 1);

    if (!code || !this.discountPreview || this.discountPreview.code !== code) {
      return null;
    }

    if (Number(this.discountPreview.requestedDurationMonths || durationMonths) !== durationMonths) {
      return null;
    }

    return this.discountPreview;
  }

  discountPreviewNotice() {
    if (!this.form.discountCode.trim()) {
      return '';
    }

    if (this.discountPreviewLoading) {
      return '正在校验优惠码适用时长...';
    }

    const preview = this.currentDiscountPreview();

    if (preview?.message) {
      return preview.message;
    }

    return '';
  }

  generatedDiscountValidDays() {
    const explicitValidDays = Number(this.generatedDiscount?.validDays || 0);

    if (explicitValidDays > 0) {
      return explicitValidDays;
    }

    const startsAt = new Date(this.generatedDiscount?.startsAt || '');
    const expiresAt = new Date(this.generatedDiscount?.expiresAt || '');

    if (!Number.isNaN(startsAt.getTime()) && !Number.isNaN(expiresAt.getTime())) {
      const diffDays = Math.round((expiresAt.getTime() - startsAt.getTime()) / 86400000);

      if (diffDays > 0) {
        return diffDays;
      }
    }

    return Math.max(1, Number(this.runtimeConfig.defaultDiscountValidDays || 0));
  }

  syncForumRuntimeConfig(data = {}) {
    const forumAttributes = app.forum?.data?.attributes;

    if (!forumAttributes) {
      return;
    }

    forumAttributes['doingfb-adslot.baseMonthlyFee'] = Number(data.baseMonthlyFee || 0);
    forumAttributes['doingfb-adslot.defaultDiscountAmount'] = Number(data.defaultDiscountAmount || 0);
    forumAttributes['doingfb-adslot.defaultDiscountValidDays'] = Number(data.defaultDiscountValidDays || 0);
    forumAttributes['doingfb-adslot.canGenerateDiscountCode'] = !!data.canGenerateDiscountCode;
    forumAttributes['doingfb-adslot.paymentGuideEnabled'] = data.paymentGuideEnabled !== false;
    forumAttributes['doingfb-adslot.paymentGuideTitle'] = String(data.paymentGuideTitle || '');
    forumAttributes['doingfb-adslot.paymentGuideText'] = String(data.paymentGuideText || '');
    forumAttributes['doingfb-adslot.paymentExtraText'] = String(data.paymentExtraText || '');
    forumAttributes['doingfb-adslot.paymentWechatAccount'] = String(data.paymentWechatAccount || '');
    forumAttributes['doingfb-adslot.paymentWechatQrCodeUrl'] = String(data.paymentWechatQrCodeUrl || '');
    forumAttributes['doingfb-adslot.paymentWechatNote'] = String(data.paymentWechatNote || '');
    forumAttributes['doingfb-adslot.paymentAlipayAccount'] = String(data.paymentAlipayAccount || '');
    forumAttributes['doingfb-adslot.paymentAlipayQrCodeUrl'] = String(data.paymentAlipayQrCodeUrl || '');
    forumAttributes['doingfb-adslot.paymentAlipayNote'] = String(data.paymentAlipayNote || '');
    forumAttributes['doingfb-adslot.paymentUsdtAccount'] = String(data.paymentUsdtAccount || '');
    forumAttributes['doingfb-adslot.paymentUsdtQrCodeUrl'] = String(data.paymentUsdtQrCodeUrl || '');
    forumAttributes['doingfb-adslot.paymentUsdtNote'] = String(data.paymentUsdtNote || '');
  }

  syncPaymentProofCopy(root) {
    if (!root || typeof root.querySelector !== 'function') {
      return;
    }

    const methods = this.paymentMethodsForDom();
    const guide = root.querySelector('.AdSlotPaymentGuide');
    if (guide) {
      guide.classList.toggle('is-missing', methods.length === 0);
      guide.innerHTML = this.buildPaymentGuideMarkup(methods);

      const toggle = guide.querySelector('.AdSlotPaymentGuide-toggle');
      if (toggle) {
        toggle.onclick = () => {
          this.paymentGuideExpanded = !this.paymentGuideExpanded;
          this.syncPaymentProofCopy(root);
        };
      }

      Array.from(guide.querySelectorAll('[data-copy-payment]')).forEach((button) => {
        button.onclick = () => this.copyPaymentText(button.getAttribute('data-copy-payment') || '', button.getAttribute('data-copy-label') || '已复制');
      });
    }

    const groups = Array.from(root.querySelectorAll('.Form-group'));
    const proofGroup = groups.find((group) => {
      const icon = group.querySelector('.fa-receipt');
      return !!icon;
    });

    if (!proofGroup) {
      return;
    }

    const label = proofGroup.querySelector(':scope > label');
    if (label) {
      label.textContent = '支付凭证';
    }

    const strong = proofGroup.querySelector('.AdSlotUploadText strong');
    if (strong) {
      strong.textContent = this.paymentProofPreviewUrl ? '重新选择支付凭证' : '点击上传支付凭证（付款后上传）';
    }

    const subText = proofGroup.querySelector('.AdSlotUploadText span');
    if (subText) {
      subText.textContent = '支持 PNG / JPG / WEBP，用于后台核对本次支付';
    }

    const hint = proofGroup.querySelector('.AdSlotUploadHint');
    if (hint) {
      hint.textContent =
        this.payableAmount() > 0 ? '请先完成转账，再上传本次支付截图用于审核。' : '当前应付金额为 0，无需付款，可直接按页面提示提交。';
    }

    const clearButton = Array.from(proofGroup.querySelectorAll('.Button')).find((button) => button.type === 'button');
    if (clearButton) {
      clearButton.textContent = '删除凭证';
    }
  }

  paymentMethodsForDom() {
    return [
      {
        title: '微信收款',
        account: String(this.runtimeConfig.paymentWechatAccount || '').trim(),
        qrCodeUrl: String(this.runtimeConfig.paymentWechatQrCodeUrl || '').trim(),
        note: String(this.runtimeConfig.paymentWechatNote || '').trim() || '支持微信扫码或转账付款。',
        buttonText: '复制微信账号',
      },
      {
        title: '支付宝收款',
        account: String(this.runtimeConfig.paymentAlipayAccount || '').trim(),
        qrCodeUrl: String(this.runtimeConfig.paymentAlipayQrCodeUrl || '').trim(),
        note: String(this.runtimeConfig.paymentAlipayNote || '').trim() || '支持支付宝扫码或转账付款。',
        buttonText: '复制支付宝账号',
      },
      {
        title: 'USDT 收款',
        account: String(this.runtimeConfig.paymentUsdtAccount || '').trim(),
        qrCodeUrl: String(this.runtimeConfig.paymentUsdtQrCodeUrl || '').trim(),
        note: String(this.runtimeConfig.paymentUsdtNote || '').trim() || '仅支持 USDT 转账，请确认链类型和地址无误。',
        buttonText: '复制地址',
      },
    ].filter((method) => method.account || method.qrCodeUrl);
  }

  buildPaymentGuideMarkup(methods) {
    const title = this.escapeHtml(String(this.runtimeConfig.paymentGuideTitle || '支付方式').trim() || '支付方式');
    const guideText = this.escapeHtml(
      String(this.runtimeConfig.paymentGuideText || '').trim() || '请先按以下收款信息完成转账，支付成功后再上传支付凭证。'
    );
    const extraText = this.escapeHtml(
      String(this.runtimeConfig.paymentExtraText || '').trim() || '完成付款后，请上传包含金额、时间和收款方信息的转账截图。'
    );
    const hasGuide = methods.length > 0;
    const cards = this.paymentGuideExpanded
      ? methods
          .map(
            (method) => `
              <div class="AdSlotPaymentMethodCard">
                <div class="AdSlotPaymentMethodCard-qr">
                  ${
                    method.qrCodeUrl
                      ? `<a class="AdSlotPaymentMethodCard-qrLink" href="${this.escapeAttribute(method.qrCodeUrl)}" target="_blank" rel="noreferrer" aria-label="查看${this.escapeAttribute(method.title)}大图"><img src="${this.escapeAttribute(method.qrCodeUrl)}" alt="${this.escapeAttribute(method.title)}"></a>`
                      : '<span>暂未配置二维码</span>'
                  }
                </div>
                <div class="AdSlotPaymentMethodCard-body">
                  <strong>${this.escapeHtml(method.title)}</strong>
                  ${method.account ? `<code>${this.escapeHtml(method.account)}</code>` : ''}
                  <p>${this.escapeHtml(method.note)}</p>
                  ${method.account ? `<button type="button" class="Button" data-copy-payment="${this.escapeAttribute(method.account)}" data-copy-label="${this.escapeAttribute(method.buttonText)}">${this.escapeHtml(method.buttonText)}</button>` : ''}
                </div>
              </div>
            `
          )
          .join('')
      : '';

    return `
      <button class="AdSlotPaymentGuide-toggle" type="button">
        <div class="AdSlotPaymentGuide-head">
          <strong>${title}</strong>
          <span>${this.paymentGuideExpanded ? '收起支付方式' : '点击展开支付方式'}</span>
        </div>
        <p class="AdSlotPaymentGuide-text">${guideText}</p>
        <div class="AdSlotPaymentGuide-summary">
          <span>支持微信 / 支付宝 / USDT</span>
          <strong>${this.paymentGuideExpanded ? '收起' : '展开'}</strong>
        </div>
      </button>
      ${this.paymentGuideExpanded && hasGuide ? `<div class="AdSlotPaymentGuide-grid">${cards}</div>` : ''}
      <p class="AdSlotPaymentGuide-note">${hasGuide ? extraText : '后台暂未配置收款信息，请先联系客服确认付款方式后再上传支付凭证。'}</p>
    `;
  }

  copyPaymentText(text, successText = '已复制') {
    if (!text || !navigator?.clipboard?.writeText) {
      return;
    }

    navigator.clipboard.writeText(text).then(() => {
      app.alerts?.show?.({ type: 'success' }, successText);
    });
  }

  escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  escapeAttribute(value) {
    return this.escapeHtml(value);
  }

  contactPlaceholder() {
    return CONTACT_PLACEHOLDERS[this.form.contactType] || '请输入联系方式';
  }

  applySourceItem() {
    if (!this.sourceItem) {
      return;
    }

    const attrs = this.sourceItem.attributes || {};
    const isRenew = this.mode === 'renew';

    this.form = {
      ...this.form,
      merchantName: attrs.merchantName || '',
      imagePath: attrs.imagePath || '',
      targetUrl: attrs.targetUrl || '',
      contactType: attrs.contactType || 'wechat',
      contactValue: attrs.contactValue || attrs.contact || '',
      discountCode: isRenew ? '' : attrs.discountCode || '',
      paymentProofPath: isRenew ? '' : attrs.paymentProofPath || '',
      durationMonths: isRenew ? 1 : Number(attrs.durationMonths || 1),
    };

    this.previewUrl = this.form.imagePath;
    this.paymentProofPreviewUrl = this.form.paymentProofPath;
  }

  introTitle() {
    if (this.mode === 'edit') {
      return '修改后重新进入人工审核';
    }

    if (this.mode === 'renew') {
      return '续费通过后将延长当前广告到期时间';
    }

    return '提交后进入人工审核';
  }

  introText() {
    if (this.mode === 'edit') {
      return '请修正广告信息和支付凭证，提交后管理员会重新审核。';
    }

    if (this.mode === 'renew') {
      return '未到期续费从原到期日顺延；已到期续费从管理员审核通过日重新起算。广告位置和排序不变。';
    }

    return '请上传展示图并填写跳转链接、联系方式；如具备权限，可直接生成优惠码抵扣广告费用。';
  }

  submitButtonText() {
    if (this.mode === 'edit') {
      return '重新提交';
    }

    if (this.mode === 'renew') {
      return '提交续费';
    }

    return '提交申请';
  }

  hide() {
    super.hide();

    if (typeof this.attrs.onclose === 'function') {
      this.attrs.onclose();
    }
  }

  onremove() {
    super.onremove();
    window.removeEventListener('focus', this.boundRuntimeConfigRefresh);
    window.removeEventListener('storage', this.boundRuntimeConfigStorageSync);
    document.removeEventListener('visibilitychange', this.boundRuntimeConfigRefresh);
    if (this.runtimeConfigRefreshTimer) {
      window.clearInterval(this.runtimeConfigRefreshTimer);
      this.runtimeConfigRefreshTimer = null;
    }
    if (this.discountPreviewTimer) {
      window.clearTimeout(this.discountPreviewTimer);
      this.discountPreviewTimer = null;
    }
    this.revokePreviewUrl(this.previewUrl);
    this.revokePreviewUrl(this.paymentProofPreviewUrl);
  }

  onContactTypeChange(event) {
    this.form.contactType = event.target.value;
    this.error = '';
  }

  onDurationChange(event) {
    this.form.durationMonths = Number(event.target.value || 1);
    this.error = '';
    this.scheduleDiscountPreview();
  }

  onDiscountCodeInput(event) {
    this.form.discountCode = event.target.value;
    this.error = '';

    if (!this.form.discountCode.trim()) {
      this.generatedDiscount = null;
      this.discountPreview = null;
      this.discountPreviewLoading = false;
      if (this.discountPreviewTimer) {
        window.clearTimeout(this.discountPreviewTimer);
        this.discountPreviewTimer = null;
      }
      return;
    }

    if (this.generatedDiscount && this.generatedDiscount.code !== this.form.discountCode.trim()) {
      this.generatedDiscount = null;
    }

    this.scheduleDiscountPreview();
  }

  onAdImageChange(event) {
    const file = event.target.files?.[0] || null;

    this.revokePreviewUrl(this.previewUrl);
    this.imageFile = file;
    this.form.imagePath = '';
    this.previewUrl = file ? URL.createObjectURL(file) : '';
    this.error = '';
  }

  onPaymentProofChange(event) {
    const file = event.target.files?.[0] || null;

    this.revokePreviewUrl(this.paymentProofPreviewUrl);
    this.paymentProofFile = file;
    this.form.paymentProofPath = '';
    this.paymentProofPreviewUrl = file ? URL.createObjectURL(file) : '';
    this.error = '';
  }

  clearAdImage() {
    this.revokePreviewUrl(this.previewUrl);
    this.imageFile = null;
    this.form.imagePath = '';
    this.previewUrl = '';
    this.error = '';

    if (this.fileInput) {
      this.fileInput.value = '';
    }
  }

  clearPaymentProof() {
    this.revokePreviewUrl(this.paymentProofPreviewUrl);
    this.paymentProofFile = null;
    this.form.paymentProofPath = '';
    this.paymentProofPreviewUrl = '';
    this.error = '';

    if (this.paymentProofInput) {
      this.paymentProofInput.value = '';
    }
  }

  revokePreviewUrl(url) {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }

  scheduleDiscountPreview(delay = 250) {
    if (this.discountPreviewTimer) {
      window.clearTimeout(this.discountPreviewTimer);
    }

    this.discountPreviewTimer = window.setTimeout(() => {
      this.discountPreviewTimer = null;
      this.loadDiscountPreview();
    }, delay);
  }

  async ensureDiscountPreview() {
    if (!this.form.discountCode.trim()) {
      return null;
    }

    const currentPreview = this.currentDiscountPreview();

    if (currentPreview) {
      return currentPreview;
    }

    if (this.discountPreviewTimer) {
      window.clearTimeout(this.discountPreviewTimer);
      this.discountPreviewTimer = null;
    }

    return this.loadDiscountPreview();
  }

  async loadDiscountPreview() {
    const code = this.form.discountCode.trim();
    const durationMonths = Number(this.form.durationMonths || 1);

    if (!code) {
      this.discountPreview = null;
      this.discountPreviewLoading = false;
      m.redraw();

      return null;
    }

    const requestKey = `${code}:${durationMonths}`;
    this.discountPreviewRequestKey = requestKey;
    this.discountPreviewLoading = true;
    m.redraw();

    try {
      const response = await app.request({
        method: 'POST',
        url: `${app.forum.attribute('apiUrl')}/adslot/discount-codes/preview`,
        body: {
          data: {
            attributes: {
              code,
              durationMonths,
            },
          },
        },
      });

      if (this.discountPreviewRequestKey === requestKey) {
        this.discountPreview = response?.data || null;
      }
    } catch (error) {
      if (this.discountPreviewRequestKey === requestKey) {
        this.discountPreview = {
          code,
          requestedDurationMonths: durationMonths,
          isApplicable: false,
          message: this.getErrorMessage(error) || '优惠码校验失败，请稍后重试。',
        };
      }
    }

    if (this.discountPreviewRequestKey === requestKey) {
      this.discountPreviewLoading = false;
      m.redraw();
    }

    return this.currentDiscountPreview();
  }

  previewFromDiscount(discount) {
    if (!discount?.code) {
      return null;
    }

    const durationMonths = Number(this.form.durationMonths || 1);
    const restrictedDuration = Number(discount.durationMonths || 0);
    const isApplicable = !restrictedDuration || restrictedDuration === durationMonths;
    const discountAmount = isApplicable ? Math.min(this.adFeeAmount(), Number(discount.amount || 0)) : 0;

    return {
      code: discount.code,
      amount: Number(discount.amount || 0),
      discountAmount,
      durationMonths: restrictedDuration || null,
      durationLabel: this.durationRestrictionLabel(restrictedDuration),
      requestedDurationMonths: durationMonths,
      isApplicable,
      message: isApplicable
        ? `该优惠码可用于当前投放时长，可抵扣 ${this.formatMoney(discountAmount)}。`
        : `该优惠码仅限 ${this.durationRestrictionLabel(restrictedDuration)}投放使用，请切换投放时长后再使用。`,
    };
  }

  async generateDiscountCode() {
    this.generatingCode = true;
    this.error = '';
    m.redraw();

    try {
      const response = await app.request({
        method: 'POST',
        url: `${app.forum.attribute('apiUrl')}/adslot/discount-codes/generate`,
        body: {
          data: {
            attributes: {},
          },
        },
      });

      this.generatedDiscount = response?.data || null;
      this.form.discountCode = this.generatedDiscount?.code || '';
      this.discountPreview = this.previewFromDiscount(this.generatedDiscount);
    } catch (error) {
      this.error = this.getErrorMessage(error);
    }

    this.generatingCode = false;
    m.redraw();
  }

  async loadRuntimeConfig(force = false) {
    if (!force && typeof document !== 'undefined' && document.hidden) {
      return;
    }

    try {
      const response = await app.request({
        method: 'GET',
        url: `${app.forum.attribute('apiUrl')}/adslot/forum/config`,
        params: {
          _t: Date.now(),
        },
      });

      return this.applyRuntimeConfig(response?.data || {});
    } catch (_error) {
      return null;
    }
  }

  applyRuntimeConfig(data) {
    if (!data) {
      return null;
    }

    this.runtimeConfig = {
      baseMonthlyFee: Number(data.baseMonthlyFee || 0),
      defaultDiscountAmount: Number(data.defaultDiscountAmount || 0),
      defaultDiscountValidDays: Number(data.defaultDiscountValidDays || 0),
      canGenerateDiscountCode: !!data.canGenerateDiscountCode,
      paymentGuideEnabled: data.paymentGuideEnabled !== false,
      paymentGuideTitle: String(data.paymentGuideTitle || '支付方式'),
      paymentGuideText: String(data.paymentGuideText || '请先按以下收款信息完成转账，支付成功后再上传支付凭证。'),
      paymentExtraText: String(data.paymentExtraText || '完成付款后，请上传包含金额、时间和收款方信息的转账截图。'),
      paymentWechatAccount: String(data.paymentWechatAccount || ''),
      paymentWechatQrCodeUrl: String(data.paymentWechatQrCodeUrl || ''),
      paymentWechatNote: String(data.paymentWechatNote || ''),
      paymentAlipayAccount: String(data.paymentAlipayAccount || ''),
      paymentAlipayQrCodeUrl: String(data.paymentAlipayQrCodeUrl || ''),
      paymentAlipayNote: String(data.paymentAlipayNote || ''),
      paymentUsdtAccount: String(data.paymentUsdtAccount || ''),
      paymentUsdtQrCodeUrl: String(data.paymentUsdtQrCodeUrl || ''),
      paymentUsdtNote: String(data.paymentUsdtNote || ''),
    };
    this.syncForumRuntimeConfig(this.runtimeConfig);
    m.redraw();

    return this.runtimeConfig;
  }

  async submit(event) {
    event.preventDefault();

    this.submitting = true;
    this.error = '';
    let uploadedAdImagePath = '';
    let uploadedPaymentProofPath = '';
    m.redraw();

    try {
      const isRenew = this.isRenewMode();
      await this.validateForm();
      if (!isRenew) {
        await this.validateAdImageFile();
      }

      if (!isRenew && this.imageFile) {
        uploadedAdImagePath = await this.uploadImage(this.imageFile, 'ad-image');
        this.form.imagePath = uploadedAdImagePath;
      }

      if (this.paymentProofFile) {
        uploadedPaymentProofPath = await this.uploadImage(this.paymentProofFile, 'payment-proof');
        this.form.paymentProofPath = uploadedPaymentProofPath;
      }

      const isUpdate = this.mode === 'edit' && this.sourceItem?.id;
      const attributes = isRenew
        ? {
            durationMonths: Number(this.form.durationMonths || 1),
            contactType: this.form.contactType,
            contactValue: this.form.contactValue,
            discountCode: this.form.discountCode || null,
            paymentProofPath: this.form.paymentProofPath || null,
          }
        : this.form;

      await app.request({
        method: isUpdate ? 'PATCH' : 'POST',
        url: isUpdate
          ? `${app.forum.attribute('apiUrl')}/adslot/items/${this.sourceItem.id}`
          : isRenew
          ? `${app.forum.attribute('apiUrl')}/adslot/items/${this.sourceItem.id}/renewals`
          : `${app.forum.attribute('apiUrl')}/adslot/items`,
        body: {
          data: {
            id: isUpdate ? String(this.sourceItem.id) : undefined,
            attributes,
          },
        },
      });

      app.alerts.show({ type: 'success' }, this.mode === 'renew' ? '续费申请已提交，等待管理员审核。' : '提交成功，等待管理员审核。');

      if (typeof this.attrs.onsubmitted === 'function') {
        this.attrs.onsubmitted();
      }

      this.hide();
    } catch (error) {
      if (uploadedAdImagePath) {
        await this.cleanupUploadedImage(uploadedAdImagePath);
      }

      if (uploadedPaymentProofPath) {
        await this.cleanupUploadedImage(uploadedPaymentProofPath);
      }

      this.error = this.getErrorMessage(error);
    }

    this.submitting = false;
    m.redraw();
  }

  async validateForm() {
    if (![1, 3, 6, 12].includes(Number(this.form.durationMonths))) {
      throw new Error('投放时长无效');
    }

    if (this.form.discountCode.trim()) {
      const preview = await this.ensureDiscountPreview();

      if (preview && !preview.isApplicable) {
        throw new Error(preview.message || '当前优惠码不能用于所选投放时长。');
      }
    }

    if (this.payableAmount() > 0 && !this.paymentProofFile && !this.form.paymentProofPath) {
      throw new Error('请上传支付凭证后再提交审核。');
    }

    if (!this.form.contactType.trim()) {
      throw new Error('请选择联系方式类型');
    }

    if (!this.form.contactValue.trim()) {
      throw new Error('联系方式账号不能为空');
    }

    if (this.isRenewMode()) {
      return;
    }

    if (!this.form.merchantName.trim()) {
      throw new Error('商家名称不能为空');
    }

    if (!this.form.targetUrl.trim()) {
      throw new Error('跳转链接不能为空');
    }

    try {
      const parsed = new URL(this.form.targetUrl);

      if (!/^https?:$/.test(parsed.protocol)) {
        throw new Error('跳转链接格式不正确');
      }
    } catch (_error) {
      throw new Error('跳转链接格式不正确');
    }
  }

  async validateAdImageFile() {
    const source = this.previewUrl || this.form.imagePath;

    if (!this.imageFile && !source) {
      throw new Error('广告图不能为空');
    }

    const result = await this.loadImageMeta(source || URL.createObjectURL(this.imageFile));

    if (!result.width || !result.height) {
      throw new Error('无法读取广告图尺寸');
    }

    if (result.width !== result.height) {
      throw new Error('广告图必须为 1:1 比例');
    }
  }

  async uploadImage(file, kind) {
    if (!file) {
      throw new Error(kind === 'payment-proof' ? '支付凭证不能为空' : '广告图不能为空');
    }

    this.uploading = true;
    m.redraw();

    try {
      const body = new FormData();
      body.append('image', file);
      body.append('kind', kind);

      const response = await app.request({
        method: 'POST',
        url: `${app.forum.attribute('apiUrl')}/adslot/upload-image`,
        serialize: (raw) => raw,
        body,
      });

      const path = response?.data?.path || response?.data?.url || '';

      if (!path) {
        throw new Error(kind === 'payment-proof' ? '支付凭证上传失败' : '广告图上传失败');
      }

      return path;
    } finally {
      this.uploading = false;
      m.redraw();
    }
  }

  async cleanupUploadedImage(path) {
    try {
      await app.request({
        method: 'DELETE',
        url: `${app.forum.attribute('apiUrl')}/adslot/upload-image`,
        body: { path },
      });
    } catch (_error) {
    }
  }

  getErrorMessage(error) {
    return (
      error?.response?.errors?.[0]?.detail ||
      error?.response?.errors?.[0]?.message ||
      error?.responseText ||
      error?.message ||
      '提交失败，请稍后重试。'
    );
  }

  loadImageMeta(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();

      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });
      };

      img.onerror = () => reject(new Error('广告图无法加载'));
      img.src = src;
    });
  }

  formatMoney(amount) {
    return `${Number(amount || 0).toFixed(2)} 元`;
  }

  formatDurationMonths(value) {
    return `${Number(value || 0)} 个月`;
  }

  durationRestrictionLabel(value) {
    const months = Number(value || 0);

    return months ? `${months} 个月` : '不限投放时长';
  }

  formatDateTime(value) {
    if (!value) {
      return '-';
    }

    const date = new Date(value);
    const formatter = new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });

    if (Number.isNaN(date.getTime())) {
      const normalized = String(value).replace('T', ' ').replace(/\.\d+/, '').trim();

      if (/([+-]\d{2}:\d{2}|Z)$/i.test(String(value))) {
        const reparsed = new Date(String(value));

        if (!Number.isNaN(reparsed.getTime())) {
          return formatter.format(reparsed).replace(/\//g, '-');
        }
      }

      return normalized.slice(0, 19);
    }

    return formatter.format(date).replace(/\//g, '-');
  }
}
