import Model from 'flarum/common/Model';

export default class AdSlotItem extends Model {
  merchantName() {
    return Model.attribute('merchantName').call(this);
  }

  startsAt() {
    return Model.attribute('startsAt', Model.transformDate).call(this);
  }

  endsAt() {
    return Model.attribute('endsAt', Model.transformDate).call(this);
  }
}
