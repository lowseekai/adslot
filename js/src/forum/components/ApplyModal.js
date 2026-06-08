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

export default class ApplyModal extends Modal {
  oninit(vnode) {
    super.oninit(vnode);

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
    };

    this.imageFile = null;
    this.paymentProofFile = null;
    this.previewUrl = '';
    this.paymentProofPreviewUrl = '';
    this.fileInput = null;
    this.paymentProofInput = null;
    this.generatedDiscount = null;
  }

  className() {
    return 'AdSlotApplyModal Modal--large';
  }

  title() {
    return '申请商家展示';
  }

  content() {
    return (
      <div className="Modal-body">
        <form className="Form AdSlotForm" onsubmit={(event) => this.submit(event)}>
          <div className="AdSlotApplyIntro">
            <div className="AdSlotApplyIntro-copy">
              <strong>提交后进入人工审核</strong>
              <p>请上传展示图并填写跳转链接、联系方式；如具备权限，可直接生成优惠码抵扣广告费用。</p>
            </div>
            <div className="AdSlotApplyIntro-badge">推荐 800 x 800</div>
          </div>

          <div className="Form-group">
            <label htmlFor="adslot-merchant-name">商家名称</label>
            <input
              id="adslot-merchant-name"
              className="FormControl"
              placeholder="例如：XXX 商家"
              value={this.form.merchantName}
              oninput={(event) => (this.form.merchantName = event.target.value)}
              disabled={this.isBusy()}
            />
          </div>

          <div className="Form-group">
            <label>广告图</label>
            <label className="AdSlotUploadCard">
              <input
                className="AdSlotUploadInput"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                oncreate={(vnode) => (this.fileInput = vnode.dom)}
                onupdate={(vnode) => (this.fileInput = vnode.dom)}
                onchange={(event) => this.onAdImageChange(event)}
                disabled={this.isBusy()}
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
                    disabled: this.isBusy(),
                  },
                  '删除图片'
                )}
              </div>
            ) : null}
          </div>

          <div className="Form-group">
            <label htmlFor="adslot-target-url">跳转链接</label>
            <input
              id="adslot-target-url"
              className="FormControl"
              placeholder="https://"
              value={this.form.targetUrl}
              oninput={(event) => (this.form.targetUrl = event.target.value)}
              disabled={this.isBusy()}
            />
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
            <p className="helpText AdSlotDiscountHint">选填。优惠码可用于抵扣广告费用，系统会按后台规则计算金额；同一优惠码提交后不可重复使用。</p>
          </div>

          <div className="AdSlotFeePanel">
            <div className="AdSlotFeePanel-row">
              <span>广告费</span>
              <strong>{this.formatMoney(this.baseMonthlyFee())}</strong>
            </div>
            <div className="AdSlotFeePanel-row">
              <span>优惠抵扣</span>
              <strong className="is-discount">-{this.formatMoney(this.discountAmount())}</strong>
            </div>
            <div className="AdSlotFeePanel-row is-total">
              <span>应付金额</span>
              <strong>{this.formatMoney(this.payableAmount())}</strong>
            </div>
            {this.generatedDiscountNotice() ? <p className="helpText AdSlotDiscountHint">{this.generatedDiscountNotice()}</p> : null}
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
              '提交申请'
            )}
          </div>
        </form>
      </div>
    );
  }

  isBusy() {
    return this.submitting || this.uploading || this.generatingCode;
  }

  baseMonthlyFee() {
    return Number(app.forum.attribute('doingfb-adslot.baseMonthlyFee') || 0);
  }

  canGenerateDiscountCode() {
    return !!app.forum.attribute('doingfb-adslot.canGenerateDiscountCode');
  }

  discountAmount() {
    if (!this.form.discountCode.trim()) {
      return 0;
    }

    if (this.generatedDiscount && this.generatedDiscount.code === this.form.discountCode.trim()) {
      return Number(this.generatedDiscount.amount || 0);
    }

    return Number(app.forum.attribute('doingfb-adslot.defaultDiscountAmount') || 0);
  }

  payableAmount() {
    return Math.max(0, this.baseMonthlyFee() - this.discountAmount());
  }

  generatedDiscountNotice() {
    if (!this.generatedDiscount || this.generatedDiscount.code !== this.form.discountCode.trim()) {
      return '';
    }

    const amount = this.formatMoney(this.generatedDiscount.amount || 0);
    const expiresAt = this.formatDateTime(this.generatedDiscount.expiresAt);

    return `当前优惠码可抵扣 ${amount}，有效期至 ${expiresAt}。`;
  }

  contactPlaceholder() {
    return CONTACT_PLACEHOLDERS[this.form.contactType] || '请输入联系方式';
  }

  hide() {
    super.hide();

    if (typeof this.attrs.onclose === 'function') {
      this.attrs.onclose();
    }
  }

  onremove() {
    super.onremove();
    this.revokePreviewUrl(this.previewUrl);
    this.revokePreviewUrl(this.paymentProofPreviewUrl);
  }

  onContactTypeChange(event) {
    this.form.contactType = event.target.value;
    this.error = '';
  }

  onDiscountCodeInput(event) {
    this.form.discountCode = event.target.value;
    this.error = '';

    if (!this.form.discountCode.trim()) {
      this.generatedDiscount = null;
    }
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
    } catch (error) {
      this.error = this.getErrorMessage(error);
    }

    this.generatingCode = false;
    m.redraw();
  }

  async submit(event) {
    event.preventDefault();

    this.submitting = true;
    this.error = '';
    let uploadedAdImagePath = '';
    let uploadedPaymentProofPath = '';
    m.redraw();

    try {
      await this.validateForm();
      await this.validateAdImageFile();

      uploadedAdImagePath = await this.uploadImage(this.imageFile, 'ad-image');
      this.form.imagePath = uploadedAdImagePath;

      if (this.paymentProofFile) {
        uploadedPaymentProofPath = await this.uploadImage(this.paymentProofFile, 'payment-proof');
        this.form.paymentProofPath = uploadedPaymentProofPath;
      }

      await app.request({
        method: 'POST',
        url: `${app.forum.attribute('apiUrl')}/adslot/items`,
        body: {
          data: {
            attributes: this.form,
          },
        },
      });

      app.alerts.show({ type: 'success' }, '提交成功，等待管理员审核。');

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
    if (!this.form.merchantName.trim()) {
      throw new Error('商家名称不能为空');
    }

    if (!this.form.targetUrl.trim()) {
      throw new Error('跳转链接不能为空');
    }

    if (!this.form.contactType.trim()) {
      throw new Error('请选择联系方式类型');
    }

    if (!this.form.contactValue.trim()) {
      throw new Error('联系方式账号不能为空');
    }

    if (this.payableAmount() > 0 && !this.paymentProofFile && !this.form.paymentProofPath) {
      throw new Error('请上传支付凭证后再提交审核。');
    }
  }

  async validateAdImageFile() {
    if (!this.imageFile) {
      throw new Error('广告图不能为空');
    }

    const result = await this.loadImageMeta(this.previewUrl || URL.createObjectURL(this.imageFile));

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
    return Number(amount || 0).toFixed(2) + ' 元';
  }

  formatDateTime(value) {
    if (!value) {
      return '-';
    }

    return String(value).replace('T', ' ').slice(0, 16);
  }
}
