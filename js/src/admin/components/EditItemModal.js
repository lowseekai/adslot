import app from 'flarum/admin/app';
import Modal from 'flarum/common/components/Modal';
import Button from 'flarum/common/components/Button';
import Stream from 'flarum/common/utils/Stream';
import withAttr from 'flarum/common/utils/withAttr';

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

const DURATION_OPTIONS = [1, 3, 6, 12];

export default class EditItemModal extends Modal {
  oninit(vnode) {
    super.oninit(vnode);

    const item = this.attrs.item;
    const attrs = item.attributes || {};

    this.item = item;
    this.merchantName = Stream(attrs.merchantName || '');
    this.imagePath = Stream(attrs.imagePath || '');
    this.targetUrl = Stream(attrs.targetUrl || '');
    this.contactType = Stream(attrs.contactType || 'wechat');
    this.contactValue = Stream(attrs.contactValue || attrs.contact || '');
    this.discountCode = Stream(attrs.discountCode || '');
    this.paymentProofPath = Stream(attrs.paymentProofPath || '');
    this.durationMonths = Stream(attrs.durationMonths || 1);
    this.adFeeAmount = Stream(attrs.adFeeAmount ?? 0);
    this.discountAmount = Stream(attrs.discountAmount ?? 0);
    this.payableAmount = Stream(attrs.payableAmount ?? 0);
    this.status = Stream(attrs.status || 'pending');
    this.isPinned = Stream(!!attrs.isPinned);
    this.isVisible = Stream(!!attrs.isVisible);
    this.sortOrder = Stream(Math.max(1, Number(attrs.sortOrder ?? 1)));
    this.startsAt = Stream(this.normalizeDate(attrs.startsAt));
    this.endsAt = Stream(this.normalizeDate(attrs.endsAt));
    this.error = '';
    this.uploading = false;
    this.imageFile = null;
    this.previewUrl = attrs.imagePath || '';
  }

  className() {
    return 'EditItemModal Modal--large';
  }

  title() {
    return `编辑商家 #${this.item.id}`;
  }

  content() {
    return (
      <div className="Modal-body">
        <form className="Form" onsubmit={(event) => this.onsubmit(event)}>
          <div className="Form-group">
            <label>商家名称</label>
            <input className="FormControl" value={this.merchantName()} oninput={withAttr('value', this.merchantName)} />
          </div>

          <div className="Form-group">
            <label>广告图地址</label>
            <input className="FormControl" value={this.imagePath()} oninput={withAttr('value', this.imagePath)} />
            <div style="margin-top: 8px;">
              <input type="file" accept="image/png,image/jpeg,image/webp" onchange={(event) => this.onFileChange(event)} />
            </div>
            <p className="helpText">建议上传横纵比例一致的展示图，推荐 800 x 800 或更高分辨率；也可以保留当前地址。</p>
            {this.previewUrl ? (
              <div className="AdSlotAdminTable-thumb" style="margin-top: 8px;">
                <img src={this.previewUrl} alt="preview" />
              </div>
            ) : null}
          </div>

          <div className="Form-group">
            <label>跳转链接</label>
            <input className="FormControl" value={this.targetUrl()} oninput={withAttr('value', this.targetUrl)} />
          </div>

          <div className="AdSlotAdminContactGrid">
            <div className="Form-group">
              <label>联系方式类型</label>
              <select className="FormControl" value={this.contactType()} onchange={withAttr('value', this.contactType)}>
                {CONTACT_OPTIONS.map((option) => (
                  <option value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            <div className="Form-group">
              <label>联系方式账号</label>
              <input
                className="FormControl"
                value={this.contactValue()}
                placeholder={this.contactPlaceholder()}
                oninput={withAttr('value', this.contactValue)}
              />
            </div>
          </div>

          <div className="AdSlotAdminContactGrid">
            <div className="Form-group">
              <label>投放时长</label>
              <select className="FormControl" value={String(this.durationMonths())} onchange={(event) => this.onDurationChange(event)}>
                {DURATION_OPTIONS.map((months) => (
                  <option value={String(months)}>{months}个月</option>
                ))}
              </select>
            </div>

            <div className="Form-group">
              <label>优惠码</label>
              <input className="FormControl" value={this.discountCode()} oninput={withAttr('value', this.discountCode)} />
            </div>
          </div>

          <div className="Form-group">
            <label>支付凭证</label>
            <input className="FormControl" value={this.paymentProofPath()} oninput={withAttr('value', this.paymentProofPath)} />
            {this.paymentProofPath() ? (
              <div className="AdSlotAdminTable-thumb" style="margin-top: 8px;">
                <a href={this.paymentProofPath()} target="_blank" rel="noreferrer">
                  <img src={this.paymentProofPath()} alt="payment-proof" />
                </a>
              </div>
            ) : null}
          </div>

          <div className="AdSlotAdminContactGrid">
            <div className="Form-group">
              <label>广告费</label>
              <input className="FormControl" type="number" step="0.01" value={this.adFeeAmount()} oninput={withAttr('value', this.adFeeAmount)} />
            </div>

            <div className="Form-group">
              <label>抵扣金额</label>
              <input className="FormControl" type="number" step="0.01" value={this.discountAmount()} oninput={withAttr('value', this.discountAmount)} />
            </div>
          </div>

          <div className="Form-group">
            <label>应付金额</label>
            <input className="FormControl" type="number" step="0.01" value={this.payableAmount()} oninput={withAttr('value', this.payableAmount)} />
            <p className="helpText">管理员可按实际合作情况手动修正结算结果。</p>
          </div>

          <div className="Form-group">
            <label>状态</label>
            <select className="FormControl" value={this.status()} onchange={withAttr('value', this.status)}>
              <option value="pending">待审核</option>
              <option value="approved">已通过</option>
              <option value="rejected">已驳回</option>
            </select>
          </div>

          <div className="Form-group">
            <label className="checkbox">
              <input type="checkbox" checked={this.isPinned()} onchange={withAttr('checked', this.isPinned)} />
              缃畾鏄剧ず
            </label>
          </div>

          <div className="Form-group">
            <label className="checkbox">
              <input type="checkbox" checked={this.isVisible()} onchange={withAttr('checked', this.isVisible)} />
              显示在前台
            </label>
          </div>

          <div className="Form-group">
            <label>排序值</label>
            <input className="FormControl" type="number" min="1" value={this.sortOrder()} oninput={withAttr('value', this.sortOrder)} />
            <p className="helpText">数字越小越靠前。</p>
          </div>

          <div className="AdSlotAdminContactGrid">
            <div className="Form-group">
              <label>开始时间</label>
              <input className="FormControl" type="datetime-local" value={this.startsAt()} oninput={withAttr('value', this.startsAt)} />
            </div>

            <div className="Form-group">
              <label>结束时间</label>
              <input className="FormControl" type="datetime-local" value={this.endsAt()} oninput={withAttr('value', this.endsAt)} />
            </div>
          </div>

          {this.error ? <div className="AdSlotNotice is-error">{this.error}</div> : null}

          <div className="Form-group">
            {Button.component(
              {
                type: 'submit',
                className: 'Button Button--primary',
                loading: this.loading || this.uploading,
              },
              '保存'
            )}
          </div>
        </form>
      </div>
    );
  }

  contactPlaceholder() {
    return CONTACT_PLACEHOLDERS[this.contactType()] || '请输入联系方式';
  }

  onDurationChange(event) {
    this.durationMonths(Number(event.target.value || 1));
  }

  async onsubmit(event) {
    event.preventDefault();

    this.loading = true;
    this.error = '';
    let uploadedImagePath = '';
    m.redraw();

    try {
      if (!this.contactValue().trim()) {
        throw new Error('联系方式账号不能为空');
      }

      if (!DURATION_OPTIONS.includes(Number(this.durationMonths()))) {
        throw new Error('投放时长无效');
      }

      if (this.imageFile) {
        uploadedImagePath = await this.uploadImage();
      }

      await app.request({
        method: 'POST',
        url: `${this.apiUrl()}/adslot/admin/items/update`,
        body: {
          data: {
            id: this.item.id,
            attributes: {
              merchantName: this.merchantName(),
              imagePath: this.imagePath(),
              targetUrl: this.targetUrl(),
              contactType: this.contactType(),
              contactValue: this.contactValue(),
              discountCode: this.discountCode(),
              paymentProofPath: this.paymentProofPath() || null,
              durationMonths: Number(this.durationMonths() || 1),
              adFeeAmount: Number(this.adFeeAmount() || 0),
              discountAmount: Number(this.discountAmount() || 0),
              payableAmount: Number(this.payableAmount() || 0),
              status: this.status(),
              isPinned: this.isPinned(),
              isVisible: this.isVisible(),
              sortOrder: Math.max(1, Number(this.sortOrder() || 1)),
              startsAt: this.startsAt() || null,
              endsAt: this.endsAt() || null,
            },
          },
        },
      });

      this.hide();

      if (typeof this.attrs.onsaved === 'function') {
        this.attrs.onsaved();
      }
    } catch (error) {
      if (uploadedImagePath) {
        await this.cleanupUploadedImage(uploadedImagePath);
      }

      this.error = error.message || '保存失败';
    }

    this.loading = false;
    m.redraw();
  }

  onFileChange(event) {
    const file = event.target.files?.[0] || null;

    this.imageFile = file;
    this.previewUrl = file ? URL.createObjectURL(file) : this.imagePath();
  }

  async uploadImage() {
    this.uploading = true;
    m.redraw();

    try {
      const body = new FormData();
      body.append('image', this.imageFile);
      body.append('kind', 'ad-image');

      const response = await app.request({
        method: 'POST',
        url: `${this.apiUrl()}/adslot/upload-image`,
        serialize: (raw) => raw,
        body,
      });

      const path = response?.data?.path || response?.data?.url || '';

      if (!path) {
        throw new Error('图片上传失败');
      }

      this.imagePath(path);
      this.previewUrl = path;

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
        url: `${this.apiUrl()}/adslot/upload-image`,
        body: { path },
      });
    } catch (_error) {
    }
  }

  normalizeDate(value) {
    if (!value) {
      return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value).replace(' ', 'T').slice(0, 16);
    }

    const formatter = new Intl.DateTimeFormat('sv-SE', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });

    return formatter.format(date).replace(' ', 'T');
  }

  apiUrl() {
    if (app.forum) {
      return app.forum.attribute('apiUrl');
    }

    return app.data.apiUrl;
  }
}
