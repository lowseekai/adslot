import app from 'flarum/forum/app';
import Modal from 'flarum/common/components/Modal';
import Button from 'flarum/common/components/Button';

const DURATIONS = [1, 3, 6, 12];

export default class ApplyModal extends Modal {
  oninit(vnode) {
    super.oninit(vnode);
    this.mode = this.attrs.mode || 'create';
    this.item = this.attrs.item || null;
    const attrs = this.item?.attributes || {};
    this.form = { merchantName: attrs.merchantName || '', imagePath: attrs.imagePath || '', targetUrl: attrs.targetUrl || '', contactType: attrs.contactType || 'wechat', contactValue: attrs.contactValue || '', durationMonths: Number(attrs.durationMonths || 1) };
    this.imageFile = null;
    this.previewUrl = this.form.imagePath;
    this.error = '';
    this.submitting = false;
    this.uploading = false;
  }

  className() { return 'AdSlotApplyModal Modal--large'; }
  title() { return this.mode === 'edit' ? '修改广告申请' : this.mode === 'renew' ? '广告续费申请' : '申请商家展示'; }

  content() {
    const disabled = this.submitting || this.uploading;
    return <div className="Modal-body"><form className="Form AdSlotForm" onsubmit={(event) => this.submit(event)}>
      <div className="AdSlotApplyIntro"><div><strong>提交后进入人工审核</strong><p>广告费用使用积分支付，审核通过后开始展示，审核拒绝会自动退回积分。</p></div><div className="AdSlotApplyIntro-badge">推荐 800 x 800</div></div>
      {this.mode !== 'renew' ? <>
        <div className="Form-group"><label>商家名称</label><input className="FormControl" required value={this.form.merchantName} oninput={(e) => (this.form.merchantName = e.target.value)} disabled={disabled} /></div>
        <div className="Form-group"><label>广告图</label><label className="AdSlotUploadCard"><input className="AdSlotUploadInput" type="file" accept="image/png,image/jpeg,image/webp" onchange={(e) => this.onImageChange(e)} disabled={disabled} /><div className="AdSlotUploadCard-main"><div className="AdSlotUploadIcon"><i className="fas fa-image" aria-hidden="true" /></div><div className="AdSlotUploadText"><strong>{this.previewUrl ? '重新选择广告图' : '点击上传广告图'}</strong><span>支持 PNG / JPG / WEBP，建议使用 1:1 图片</span></div></div></label>{this.previewUrl ? <div className="AdSlotUploadPreview"><img src={this.previewUrl} alt="广告图预览" /></div> : null}</div>
        <div className="Form-group"><label>跳转链接</label><input className="FormControl" type="url" required placeholder="https://" value={this.form.targetUrl} oninput={(e) => (this.form.targetUrl = e.target.value)} disabled={disabled} /></div>
      </> : null}
      <div className="AdSlotApplyGrid"><div className="Form-group"><label>联系方式类型</label><select className="FormControl" value={this.form.contactType} onchange={(e) => (this.form.contactType = e.target.value)} disabled={disabled}><option value="wechat">微信</option><option value="telegram">Telegram</option><option value="email">邮箱</option></select></div><div className="Form-group"><label>联系方式账号</label><input className="FormControl" required value={this.form.contactValue} oninput={(e) => (this.form.contactValue = e.target.value)} disabled={disabled} /></div></div>
      <div className="Form-group"><label>投放时长</label><select className="FormControl" value={String(this.form.durationMonths)} onchange={(e) => (this.form.durationMonths = Number(e.target.value))} disabled={disabled}>{DURATIONS.map((months) => <option value={String(months)}>{months} 个月</option>)}</select><p className="helpText">费用按广告中心配置计算，提交时从积分余额中冻结。</p></div>
      {this.error ? <div className="Alert Alert--error">{this.error}</div> : null}
      <div className="AdSlotActions">{Button.component({ type: 'button', className: 'Button', onclick: () => this.hide(), disabled }, '取消')}{Button.component({ type: 'submit', className: 'Button Button--primary', loading: disabled }, this.mode === 'renew' ? '提交续费申请' : '提交申请')}</div>
    </form></div>;
  }

  onImageChange(event) { this.imageFile = event.target.files?.[0] || null; this.previewUrl = this.imageFile ? URL.createObjectURL(this.imageFile) : this.form.imagePath; }

  async submit(event) {
    event.preventDefault(); this.submitting = true; this.error = ''; let uploadedPath = '';
    try {
      if (!this.form.contactValue.trim()) throw new Error('联系方式不能为空');
      if (this.mode !== 'renew') {
        if (!this.form.merchantName.trim()) throw new Error('商家名称不能为空');
        if (!this.form.targetUrl.trim() || !/^https?:$/.test(new URL(this.form.targetUrl).protocol)) throw new Error('跳转链接格式不正确');
        if (this.imageFile) { uploadedPath = await this.uploadImage(this.imageFile); this.form.imagePath = uploadedPath; }
        if (!this.form.imagePath) throw new Error('请上传广告图');
      }
      const api = app.forum.attribute('apiUrl'); const isRenew = this.mode === 'renew' && this.item?.id; const isEdit = this.mode === 'edit' && this.item?.id;
      const url = isRenew ? `${api}/adslot/items/${this.item.id}/renewals` : isEdit ? `${api}/adslot/items/${this.item.id}` : `${api}/adslot/items`;
      const method = isRenew ? 'POST' : isEdit ? 'PATCH' : 'POST'; const attributes = isRenew ? { durationMonths: this.form.durationMonths, contactType: this.form.contactType, contactValue: this.form.contactValue } : this.form;
      await app.request({ method, url, body: { data: { id: this.item?.id, attributes } } });
      app.alerts.show({ type: 'success' }, '申请已提交，等待管理员审核。'); this.attrs.onsubmitted?.(); this.hide();
    } catch (error) { if (uploadedPath) this.cleanupUploadedImage(uploadedPath); this.error = error?.response?.errors?.[0]?.detail || error?.response?.errors?.[0]?.title || error?.message || '提交失败，请稍后重试。'; }
    this.submitting = false; m.redraw();
  }

  async uploadImage(file) { this.uploading = true; try { const body = new FormData(); body.append('image', file); const response = await app.request({ method: 'POST', url: `${app.forum.attribute('apiUrl')}/adslot/upload-image`, serialize: (value) => value, body }); return response?.data?.path || ''; } finally { this.uploading = false; } }
  async cleanupUploadedImage(path) { try { await app.request({ method: 'DELETE', url: `${app.forum.attribute('apiUrl')}/adslot/upload-image`, body: { path } }); } catch (_) {} }
}
