import app from 'flarum/forum/app';
import Button from 'flarum/common/components/Button';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
import Page from 'flarum/common/components/Page';

const OPEN_APPLY_MODAL_KEY = 'doingfb-adslot.open-apply-modal';

export default class ApplyPage extends Page {
  oninit(vnode) {
    super.oninit(vnode);
    this.redirecting = false;
  }

  oncreate(vnode) {
    super.oncreate(vnode);
    this.redirectAndOpen();
  }

  redirectAndOpen() {
    if (this.redirecting) {
      return;
    }

    this.redirecting = true;
    m.redraw();

    window.localStorage?.setItem(OPEN_APPLY_MODAL_KEY, String(Date.now()));
    m.route.set(app.route('adslotProviders'));

    window.setTimeout(() => {
      this.redirecting = false;
      m.redraw();
    }, 0);
  }

  view() {
    return (
      <div className="AdSlotApplyPage">
        <div className="container">
          <div className="AdSlotApplyPageState">
            {this.redirecting ? <LoadingIndicator display="block" /> : null}
            <p>正在打开申请弹窗...</p>
            {Button.component(
              {
                className: 'Button',
                onclick: () => this.redirectAndOpen(),
                disabled: this.redirecting,
              },
              '立即打开申请弹窗'
            )}
          </div>
        </div>
      </div>
    );
  }
}
