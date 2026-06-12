import Modal from 'flarum/common/components/Modal';

export default class ImagePreviewModal extends Modal {
  className() {
    return 'AdSlotImagePreviewModal Modal--large';
  }

  title() {
    return this.attrs.title || '图片预览';
  }

  content() {
    return (
      <div className="Modal-body">
        <div className="AdSlotImagePreviewModal-body">
          <img src={this.attrs.src} alt={this.attrs.alt || this.attrs.title || 'preview'} />
        </div>
      </div>
    );
  }
}
