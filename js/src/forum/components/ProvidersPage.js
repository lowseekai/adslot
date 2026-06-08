import app from 'flarum/forum/app';
import Button from 'flarum/common/components/Button';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
import Page from 'flarum/common/components/Page';
import ApplyModal from './ApplyModal';

export default class ProvidersPage extends Page {
  oninit(vnode) {
    super.oninit(vnode);

    this.loading = true;
    this.items = [];
    this.error = '';

    this.loadItems();
  }

  view() {
    return (
      <div className="AdSlotProvidersPage">
        <div className="container">
          <div className="AdSlotHero">
            <div>
              <h1>商家合作</h1>
              <p>这里仅展示已审核通过的商家广告图，建议使用横纵比例一致的图片，以获得更稳定的展示效果。</p>
            </div>
            {Button.component(
              {
                className: 'Button Button--primary',
                icon: 'fas fa-plus',
                onclick: () => app.modal.show(ApplyModal),
              },
              '申请展示'
            )}
          </div>

          {this.loading ? <LoadingIndicator display="block" /> : null}
          {this.error ? <div className="AdSlotNotice is-error">{this.error}</div> : null}

          {this.items.length ? (
            <div className="AdSlotGrid">
              {this.items.map((item) => this.renderItem(item))}
            </div>
          ) : this.loading ? null : (
            <div className="AdSlotEmpty">当前还没有可展示的商家内容。</div>
          )}
        </div>
      </div>
    );
  }

  renderItem(item) {
    const attrs = item.attributes || {};

    return (
      <a className="AdSlotCard" href={attrs.targetUrl} target="_blank" rel="noreferrer" key={item.id}>
        <div className="AdSlotCard-media">
          <img src={attrs.imagePath} alt={attrs.merchantName} width="180" />
        </div>
      </a>
    );
  }

  async loadItems() {
    this.loading = true;
    this.error = '';
    m.redraw();

    try {
      const response = await app.request({
        method: 'GET',
        url: `${app.forum.attribute('apiUrl')}/adslot/public/items`,
      });

      this.items = response.data || [];
    } catch (error) {
      this.error = error.message || '加载失败';
    }

    this.loading = false;
    m.redraw();
  }
}
