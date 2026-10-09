import app from 'flarum/admin/app';
import Component from 'flarum/common/Component';
import Button from 'flarum/common/components/Button';
import ImagePreviewModal from './ImagePreviewModal';

export default class ReviewTable extends Component {
  view() {
    const items = this.attrs.items || [];
    return <div className="AdSlotAdminTableWrap"><table className="AdSlotAdminTable AdSlotAdminTable--compact">
      <thead><tr><th>ID</th><th>Merchant</th><th>Image</th><th>Link</th><th>Duration</th><th>Status</th><th>Expires</th><th>Created</th><th>Actions</th></tr></thead>
      <tbody>{items.length ? items.map((item) => this.renderRow(item)) : <tr><td colSpan="9" className="AdSlotAdminTable-empty">No data</td></tr>}</tbody>
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
      <td>{Number(a.durationMonths || 1)} months</td>
      <td><span className={`AdSlotBadge is-${status}`}>{this.statusLabel(status)}</span></td>
      <td>{this.dateOnly(a.endsAt)}</td><td>{this.attrs.formatDate(a.createdAt)}</td><td>{this.renderActions(item)}</td>
    </tr>;
  }

  renderActions(item) {
    const a = item.attributes || {};
    return <div className="AdSlotAdminTable-actions">
      {Button.component({ className: 'Button Button--small AdSlotAdminAction AdSlotAdminAction--icon', icon: 'fas fa-pen', title: 'Edit', onclick: () => this.attrs.onEdit?.(item) }, '')}
      {Button.component({ className: 'Button Button--small AdSlotAdminAction AdSlotAdminAction--icon is-success', icon: 'fas fa-check', title: 'Approve', onclick: () => this.attrs.onApprove?.(item) }, '')}
      {Button.component({ className: 'Button Button--small AdSlotAdminAction AdSlotAdminAction--icon is-warning', icon: 'fas fa-ban', title: 'Reject', onclick: () => this.attrs.onReject?.(item) }, '')}
      {Button.component({ className: 'Button Button--small AdSlotAdminAction AdSlotAdminAction--icon', icon: a.isVisible ? 'fas fa-eye-slash' : 'fas fa-eye', title: a.isVisible ? 'Hide' : 'Show', onclick: () => this.attrs.onToggleVisible?.(item) }, '')}
      {Button.component({ className: 'Button Button--small Button--danger AdSlotAdminAction AdSlotAdminAction--icon', icon: 'fas fa-trash', title: 'Delete', onclick: () => this.attrs.onDelete?.(item) }, '')}
    </div>;
  }

  renderThumb(src, title) {
    if (!src) return <span className="AdSlotAdminTable-thumbPlaceholder">-</span>;
    return <button type="button" className="AdSlotAdminThumbButton" title={title} onclick={() => app.modal.show(ImagePreviewModal, { src, title, alt: title })}><span className="AdSlotAdminTable-thumb"><img src={src} alt={title} /></span></button>;
  }

  contactTypeLabel(type) { return ({ wechat: 'WeChat', telegram: 'Telegram', email: 'Email' })[type] || 'Contact'; }
  statusLabel(status) { return ({ pending: 'Pending', approved: 'Approved', rejected: 'Rejected' })[status] || status; }
  shortUrl(url) { return url ? url.split("://").pop().slice(0, 42) : "-"; }
  dateOnly(value) {
    if (!value) return 'Permanent';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value).slice(0, 10) : new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Shanghai' }).format(d);
  }
}

