import app from 'flarum/admin/app';
import Component from 'flarum/common/Component';
import Button from 'flarum/common/components/Button';
import ImagePreviewModal from './ImagePreviewModal';

export default class ReviewTable extends Component {
  view() {
    const items = this.attrs.items || [];
    const emptyText = this.attrs.emptyText || '暂无数据';

    return (
      <div className="AdSlotAdminTableWrap">
        <table className="AdSlotAdminTable AdSlotAdminTable--compact">
          <colgroup>
            <col className="AdSlotAdminTable-colId" />
            <col className="AdSlotAdminTable-colMerchant" />
            <col className="AdSlotAdminTable-colThumb" />
            <col className="AdSlotAdminTable-colLink" />
            <col className="AdSlotAdminTable-colThumb" />
            <col className="AdSlotAdminTable-colSettlement" />
            <col className="AdSlotAdminTable-colState" />
            <col className="AdSlotAdminTable-colTimeRange" />
            <col className="AdSlotAdminTable-colTime" />
            <col className="AdSlotAdminTable-colActions" />
          </colgroup>
          <thead>
            <tr>
              <th>ID</th>
              <th>商家与联系</th>
              <th>广告图</th>
              <th>链接与优惠码</th>
              <th>支付凭证</th>
              <th>结算</th>
              <th>状态</th>
              <th>到期时间</th>
              <th>提交时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {items.length ? (
              items.map((item) => this.renderRow(item))
            ) : (
              <tr>
                <td colSpan="10" className="AdSlotAdminTable-empty">
                  {emptyText}
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
    const merchantName = attrs.merchantName || '-';
    const contactTypeLabel = this.contactTypeLabel(attrs.contactType);
    const contactValue = attrs.contactValue || attrs.contact || '-';
    const contact = `${contactTypeLabel} · ${contactValue}`;
    const targetUrl = attrs.targetUrl || '';
    const shortUrl = this.shortUrl(targetUrl);
    const discountCode = attrs.discountCode || '无码';
    const durationMonths = Number(attrs.durationMonths || 1);
    const sortOrder = attrs.sortOrder || 0;
    const reviewNote = attrs.reviewNote || '';
    const isPinned = !!attrs.isPinned;
    const isVisible = !!attrs.isVisible;
    const status = attrs.status;
    const createdAtTitle = this.attrs.formatDate(attrs.createdAt);
    const createdAtText = this.shortDate(attrs.createdAt);

    return (
      <tr key={item.id}>
        <td className="AdSlotAdminTable-colId">#{item.id}</td>
        <td className="AdSlotAdminTable-colMerchant">
          <div className="AdSlotAdminTable-inlineCluster AdSlotAdminTable-inlineCluster--merchant" title={`${merchantName} ${contact}`}>
            <div className="AdSlotAdminTable-name" title={merchantName}>
              {merchantName}
            </div>
            <div className="AdSlotAdminTable-inlineMeta AdSlotAdminTable-inlineMeta--compact" title={contact}>
              <span className="AdSlotAdminTable-inlineMetaValue">{contact}</span>
            </div>
            {reviewNote ? (
              <span className="AdSlotAdminTable-noteTag" title={reviewNote}>
                备注
              </span>
            ) : null}
          </div>
        </td>
        <td className="AdSlotAdminTable-colThumb">{this.renderThumb(attrs.imagePath, merchantName || '广告图')}</td>
        <td className="AdSlotAdminTable-colLink">
          <div className="AdSlotAdminTable-inlineCluster AdSlotAdminTable-inlineCluster--link">
            <a className="AdSlotAdminTable-link" href={targetUrl} target="_blank" rel="noreferrer" title={targetUrl}>
              {shortUrl}
            </a>
            <div className="AdSlotAdminTable-chipRow AdSlotAdminTable-chipRow--compact">
              {isPinned ? (
                <span className="AdSlotAdminTable-chip AdSlotAdminTable-chip--accent" title="已置顶">
                  置顶
                </span>
              ) : null}
              <div className={`AdSlotAdminTable-codeTag${attrs.discountCode ? '' : ' is-muted'}`} title={discountCode}>
                <i className="fas fa-ticket-alt" aria-hidden="true"></i>
                <span>{discountCode}</span>
              </div>
              <span className="AdSlotAdminTable-chip AdSlotAdminTable-chip--soft" title={`${durationMonths}个月`}>
                {`${durationMonths}个月`}
              </span>
            </div>
          </div>
        </td>
        <td className="AdSlotAdminTable-colThumb">{this.renderThumb(attrs.paymentProofPath, '支付凭证', true)}</td>
        <td className="AdSlotAdminTable-colSettlement">
          <div className="AdSlotAdminTable-statGrid AdSlotAdminTable-statGrid--compact">
            {this.renderMoneyPill('广', attrs.adFeeAmount)}
            {this.renderMoneyPill('抵', attrs.discountAmount)}
            {this.renderMoneyPill('付', attrs.payableAmount, true)}
          </div>
        </td>
        <td className="AdSlotAdminTable-colState">
          <div className="AdSlotAdminTable-stateGrid AdSlotAdminTable-stateGrid--compact">
            {this.renderCompactStatusBadge(status)}
            {this.renderCompactVisibleBadge(isVisible)}
            <span className="AdSlotAdminTable-chip AdSlotAdminTable-chip--soft" title={`排序 ${sortOrder}`}>
              {`排 ${sortOrder}`}
            </span>
          </div>
        </td>
        <td className="AdSlotAdminTable-colTimeRange">{this.renderExpiresAt(attrs.endsAt)}</td>
        <td className="AdSlotAdminTable-colTime">
          <span className="AdSlotAdminTable-timeText" title={createdAtTitle}>
            {createdAtText}
          </span>
        </td>
        <td className="AdSlotAdminTable-colActions">{this.renderActions(item)}</td>
      </tr>
    );
  }

  renderMoneyPill(label, value, emphasize = false) {
    return (
      <span
        className={`AdSlotAdminTable-pill AdSlotAdminTable-pill--stacked${emphasize ? ' is-strong' : ''}`}
        title={`${label} ${this.attrs.formatMoney(value)}`}
      >
        <span className="AdSlotAdminTable-pillLabel">{label}</span>
        <strong className="AdSlotAdminTable-pillValue">{this.compactMoney(value)}</strong>
      </span>
    );
  }

  renderExpiresAt(endsAt) {
    if (!endsAt) {
      return <span className="AdSlotAdminTable-muted">长期</span>;
    }

    const expiresAtTitle = this.attrs.formatDate(endsAt);

    return (
      <span className="AdSlotAdminTable-timeRange" title={`到期时间 ${expiresAtTitle}`}>
        {this.dateOnly(endsAt)}
      </span>
    );
  }

  renderThumb(src, title, allowEmpty = false) {
    if (!src) {
      return <span className="AdSlotAdminTable-thumbPlaceholder">{allowEmpty ? '未传' : '暂无'}</span>;
    }

    return (
      <button
        type="button"
        className="AdSlotAdminThumbButton"
        title={title}
        aria-label={title}
        onclick={() =>
          app.modal.show(ImagePreviewModal, {
            src,
            title,
            alt: title,
          })
        }
      >
        <span className="AdSlotAdminTable-thumb" title={title}>
          <img src={src} alt={title} />
        </span>
      </button>
    );
  }

  renderActions(item) {
    const attrs = item.attributes || {};
    const isPinned = !!attrs.isPinned;
    const isVisible = !!attrs.isVisible;

    return (
      <div className="AdSlotAdminTable-actions">
        {Button.component(
          {
            className: 'Button Button--small AdSlotAdminAction AdSlotAdminAction--icon',
            icon: 'fas fa-pen',
            title: '修改',
            'aria-label': '修改',
            onclick: () => this.attrs.onEdit?.(item),
          },
          ''
        )}
        {Button.component(
          {
            className: 'Button Button--small AdSlotAdminAction AdSlotAdminAction--icon is-success',
            icon: 'fas fa-check',
            title: '通过',
            'aria-label': '通过',
            onclick: () => this.attrs.onApprove?.(item),
          },
          ''
        )}
        {Button.component(
          {
            className: 'Button Button--small AdSlotAdminAction AdSlotAdminAction--icon is-warning',
            icon: 'fas fa-ban',
            title: '驳回',
            'aria-label': '驳回',
            onclick: () => this.attrs.onReject?.(item),
          },
          ''
        )}
        {Button.component(
          {
            className: `Button Button--small AdSlotAdminAction AdSlotAdminAction--icon${isPinned ? ' is-active' : ''}`,
            icon: 'fas fa-thumbtack',
            title: isPinned ? '取消置顶' : '置顶',
            'aria-label': isPinned ? '取消置顶' : '置顶',
            onclick: () => this.attrs.onTogglePinned?.(item),
          },
          ''
        )}
        {Button.component(
          {
            className: 'Button Button--small AdSlotAdminAction AdSlotAdminAction--icon',
            icon: isVisible ? 'fas fa-eye-slash' : 'fas fa-eye',
            title: isVisible ? '下架' : '上架',
            'aria-label': isVisible ? '下架' : '上架',
            onclick: () => this.attrs.onToggleVisible?.(item),
          },
          ''
        )}
        {Button.component(
          {
            className: 'Button Button--small Button--danger AdSlotAdminAction AdSlotAdminAction--icon is-danger',
            icon: 'fas fa-trash',
            title: '删除',
            'aria-label': '删除',
            onclick: () => this.attrs.onDelete?.(item),
          },
          ''
        )}
      </div>
    );
  }

  contactTypeLabel(type) {
    const labelMap = {
      wechat: '微信',
      telegram: 'Telegram',
      email: '邮箱',
    };

    return labelMap[type] || '联系方式';
  }

  shortUrl(url) {
    if (!url) {
      return '-';
    }

    return url.replace(/^https?:\/\//, '').slice(0, 38);
  }

  compactMoney(value) {
    return Number(value || 0)
      .toFixed(2)
      .replace(/\.?0+$/, '');
  }

  renderCompactStatusBadge(status) {
    const labelMap = {
      pending: '待审',
      approved: '通过',
      rejected: '驳回',
    };
    const fullLabelMap = {
      pending: '待审核',
      approved: '已通过',
      rejected: '已驳回',
    };

    return (
      <span className={`AdSlotBadge is-${status || 'pending'}`} title={fullLabelMap[status] || status || '-'}>
        {labelMap[status] || status || '-'}
      </span>
    );
  }

  renderCompactVisibleBadge(isVisible) {
    return (
      <span className={`AdSlotBadge ${isVisible ? 'is-visible' : 'is-hidden'}`} title={isVisible ? '显示中' : '隐藏中'}>
        {isVisible ? '显' : '隐'}
      </span>
    );
  }

  shortDate(value) {
    if (!value) {
      return '-';
    }

    const fullText = this.attrs.formatDate(value);

    return fullText.length > 11 ? fullText.slice(5) : fullText;
  }

  dateOnly(value) {
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
}
