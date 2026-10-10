import app from 'flarum/admin/app';
import ExtensionPanel from './components/ExtensionPanel';

const ADMIN_STYLE_OVERRIDE_ID = 'doingfb-adslot-admin-style-overrides';

function ensureAdminStyleOverrides() {
  if (typeof document === 'undefined' || document.getElementById(ADMIN_STYLE_OVERRIDE_ID)) {
    return;
  }

  const style = document.createElement('style');
  style.id = ADMIN_STYLE_OVERRIDE_ID;
  style.textContent = `
    .AdSlotAdminTable--compact { min-width: 1080px; }
    .AdSlotAdminTable-colMerchant { width: 17%; min-width: 200px; }
    .AdSlotAdminTable-colThumb { width: 58px; min-width: 58px; }
    .AdSlotAdminTable-colLink { width: 27%; min-width: 300px; max-width: 340px; }
    .AdSlotAdminTable-colSettlement { width: 11%; min-width: 126px; }
    .AdSlotAdminTable-colState { width: 8%; min-width: 92px; }
    .AdSlotAdminTable-colTime { width: 7%; min-width: 88px; }
    .AdSlotAdminTable-colTimeRange { width: 7%; min-width: 88px; }
    .AdSlotAdminTable-colActions,
    .AdSlotAdminTable th:last-child,
    .AdSlotAdminTable td:last-child { width: 112px; min-width: 112px; }
    .AdSlotAdminTable thead th { padding: 9px 7px; }
    .AdSlotAdminTable tbody td { padding: 7px 6px; }
    .AdSlotAdminTable-actions { gap: 3px; max-width: 112px; }
    .AdSlotAdminAction--icon { width: 20px; min-width: 20px; height: 20px; }
    .AdSlotBadge { min-width: 0; padding: 3px 8px; }
    .AdSlotAdminTable-chip { min-height: 18px; padding: 0 5px; font-size: 10px; }
    .AdSlotAdminTable-pill { gap: 4px; min-height: 22px; padding: 2px 5px; }
    .AdSlotAdminTable-pill--stacked { align-items: center; gap: 2px; padding: 1px 5px; }
    .AdSlotAdminTable-pillLabel,
    .AdSlotAdminTable-pillValue { font-size: 10px; }
    .AdSlotAdminTable-statGrid { flex-direction: row; flex-wrap: nowrap; align-items: center; gap: 2px; white-space: nowrap; }
    .AdSlotAdminTable-stateGrid { flex-wrap: nowrap; gap: 2px; white-space: nowrap; }
    .AdSlotAdminTable-timeRange { line-height: 1.15; }
    .AdSlotAdminTable-inlineCluster { display: flex; align-items: center; gap: 6px; min-width: 0; width: 100%; }
    .AdSlotAdminTable-inlineCluster--merchant,
    .AdSlotAdminTable-inlineCluster--link { flex-wrap: nowrap; justify-content: flex-start; }
    .AdSlotAdminTable-inlineCluster > * { min-width: 0; }
    .AdSlotAdminTable-chipRow { flex-wrap: nowrap; gap: 5px; align-items: center; }
    .AdSlotAdminTable-thumb,
    .AdSlotAdminTable-thumbPlaceholder { width: 40px; height: 40px; }
  `;

  document.head.appendChild(style);
}

app.initializers.add('doingfb-adslot', () => {
  ensureAdminStyleOverrides();
  // Flarum 2 exposes the registration API on the app registry. The extension
  // metadata object may exist too, but it does not provide register methods.
  const extension = app.registry?.for?.('doingfb-adslot') || app.extensionData?.for?.('doingfb-adslot');

  if (!extension) {
    return;
  }

  if (typeof extension.registerPage === 'function') {
    extension.registerPage(ExtensionPanel);
  }

  if (typeof extension.registerSetting === 'function') {
    extension.registerSetting({
      setting: 'doingfb-adslot.baseMonthlyFee',
      type: 'number',
      label: 'Monthly advertising price (points)',
      help: 'Default monthly price used when a new advertisement is submitted.',
    });
    extension.registerSetting({
      setting: 'doingfb-adslot.noticeBarEnabled',
      type: 'boolean',
      label: 'Show provider page notice',
    });
  }

  if (typeof extension.registerPermission === 'function') {
    extension.registerPermission(
      {
        icon: 'fas fa-rectangle-ad',
        label: app.translator.trans('doingfb-adslot.admin.permissions.review_ads'),
        permission: 'doingfb-adslot.reviewAds',
      },
      'moderate'
    );
    extension.registerPermission(
      {
        icon: 'fas fa-bullhorn',
        label: app.translator.trans('doingfb-adslot.admin.permissions.manage_ads'),
        permission: 'doingfb-adslot.manageAds',
      },
      'moderate'
    );
  }
});
