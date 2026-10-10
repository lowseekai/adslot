import app from 'flarum/admin/app';
import Component from 'flarum/common/Component';
import Button from 'flarum/common/components/Button';
import ImagePreviewModal from './ImagePreviewModal';

export default class ReviewTable extends Component {
  view() {
    const items = this.attrs.items || [];
    return <div className="AdSlotAdminTableWrap"><table className="AdSlotAdminTable AdSlotAdminTable--compact">
      <thead><tr><th>ID</th><th>商家名称</th><th>广告图</th><th>跳转链接</th><th>投放时长</th><th>状态</th><th>到期时间</th><th>提交时间</th><th>操作</th></tr></thead>
      <tbody>{items.length ? items.map((item) => this.renderRow(item)) : <tr><td colSpan="9" className="AdSlotAdminTable-empty">暂无数据</td></tr>}</tbody>
    </table></div>;
  }

  renderRow(item) {
    const a = item.attributes || {};
    const merchant = a.merchantName || '-';
    const contact = `${this.contactTypeLabel(a.contactType)}: ${a.contactValue || a.contact || '-'}`;
    const status = a.status || 'pending';
    return <tr key={item.id}>
      <td>#{item.id}</td>
      <td><div className="AdSlotAdminTable-stack"><strong>{merchant}</strong><span>{contact}</span>{a.reviewNote ? <span>{a.reviewNote}</span> : null}</div></td>
      <td className="AdSlotAdminTable-colThumb">{this.renderThumb(a.imagePath, merchant)}</td>
      <td><a href={a.targetUrl || '#'} target="_blank" rel="noreferrer">{this.shortUrl(a.targetUrl)}</a></td>
      <td>{Number(a.durationMonths || 1)} 个月</td>
      <td><span className={`AdSlotBadge is-${status}`}>{this.statusLabel(status)}</span></td>
      <td>{this.dateOnly(a.endsAt)}</td><td>{this.attrs.formatDate(a.createdAt)}</td><td>{this.renderActions(item)}</td>
    </tr>;
  }

  renderActions(item) {
    const a = item.attributes || {};
    return <div className="AdSlotAdminTable-actions">
      {Button.component({ className: 'Button Button--small AdSlotAdminAction AdSlotAdminAction--icon', icon: 'fas fa-pen', title: '编辑', onclick: () => this.attrs.onEdit?.(item) }, '')}
      {Button.component({ className: 'Button Button--small AdSlotAdminAction AdSlotAdminAction--icon is-success', icon: 'fas fa-check', title: '通过', onclick: () => this.attrs.onApprove?.(item) }, '')}
      {Button.component({ className: 'Button Button--small AdSlotAdminAction AdSlotAdminAction--icon is-warning', icon: 'fas fa-ban', title: '驳回', onclick: () => this.attrs.onReject?.(item) }, '')}
      {Button.component({ className: 'Button Button--small AdSlotAdminAction AdSlotAdminAction--icon', icon: a.isVisible ? 'fas fa-eye-slash' : 'fas fa-eye', title: a.isVisible ? '隐藏' : '显示', onclick: () => this.attrs.onToggleVisible?.(item) }, '')}
      {Button.component({ className: 'Button Button--small Button--danger AdSlotAdminAction AdSlotAdminAction--icon', icon: 'fas fa-trash', title: '删除', onclick: () => this.attrs.onDelete?.(item) }, '')}
    </div>;
  }

  renderThumb(src, title) {
    if (!src) return <span className="AdSlotAdminTable-thumbPlaceholder">-</span>;
    return <button type="button" className="AdSlotAdminThumbButton" title={title} onclick={() => app.modal.show(ImagePreviewModal, { src, title, alt: title })}><span className="AdSlotAdminTable-thumb"><img src={src} alt={title} /></span></button>;
  }

  contactTypeLabel(type) { return ({ wechat: '微信', telegram: 'Telegram', email: '邮箱' })[type] || '联系方式'; }
  statusLabel(status) { return ({ pending: '待审核', approved: '已通过', rejected: '已驳回' })[status] || status; }
  shortUrl(url) { return url ? url.split("://").pop().slice(0, 42) : "-"; }
  dateOnly(value) {
    if (!value) return '长期';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value).slice(0, 10) : new Intl.DateTimeFormat('zh-CN', { timeZone: 'Asia/Shanghai' }).format(d).replace(/\//g, '-');
  }
}

