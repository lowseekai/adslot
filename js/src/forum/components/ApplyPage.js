import app from 'flarum/forum/app';
import LoadingIndicator from 'flarum/common/components/LoadingIndicator';
import Page from 'flarum/common/components/Page';
import ApplyModal from './ApplyModal';

export default class ApplyPage extends Page {
  oninit(vnode) {
    super.oninit(vnode);
    this.opened = false;
  }

  oncreate(vnode) {
    super.oncreate(vnode);

    if (this.opened) {
      return;
    }

    this.opened = true;

    app.modal.show(ApplyModal, {
      onclose: () => {
        if (app.current.get('routeName') === 'adslotApply') {
          m.route.set(app.route('adslotProviders'));
        }
      },
    });
  }

  view() {
    return (
      <div className="AdSlotApplyPage">
        <div className="container">
          <div className="AdSlotApplyPageState">
            <LoadingIndicator display="block" />
            <p>正在打开申请弹窗...</p>
          </div>
        </div>
      </div>
    );
  }
}
