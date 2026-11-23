const MENU_ID = 'marker-highlights';
const TITLE_ON = 'Highlights';
const TITLE_OFF = 'Highlights (click extension icon to activate)';

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: TITLE_OFF,
    contexts: ['all'],
    enabled: false,
  });
});

function isActive(tabId) {
  return chrome.tabs
    .sendMessage(tabId, { type: 'mk-status' })
    .then((res) => res?.active === true)
    .catch(() => false);
}

function setTabVisual(tabId, active) {
  chrome.action.setBadgeText({ tabId, text: active ? 'ON' : '' });
  if (active) chrome.action.setBadgeBackgroundColor({ tabId, color: '#4a9eff' });
  chrome.contextMenus.update(MENU_ID, {
    enabled: active,
    title: active ? TITLE_ON : TITLE_OFF,
  });
}

function syncMenu(tabId) {
  isActive(tabId).then((active) => setTabVisual(tabId, active));
}

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !/^https?:/.test(tab.url ?? '')) return;
  if (await isActive(tab.id)) {
    await chrome.tabs.sendMessage(tab.id, { type: 'mk-deactivate' }).catch(() => {});
    setTabVisual(tab.id, false);
  } else {
    await chrome.scripting
      .executeScript({ target: { tabId: tab.id }, files: ['content.js'] })
      .catch(() => {});
    // If the script was already injected (e.g. after a service-worker
    // restart), executeScript is a no-op guard — tell it to activate.
    await chrome.tabs.sendMessage(tab.id, { type: 'mk-activate' }).catch(() => {});
    setTabVisual(tab.id, true);
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === MENU_ID && tab?.id) {
    chrome.tabs.sendMessage(tab.id, { type: 'mk-toggle-panel' }).catch(() => {});
  }
});

chrome.tabs.onActivated.addListener(({ tabId }) => syncMenu(tabId));
chrome.tabs.onUpdated.addListener((tabId, info, tab) => {
  if (info.status === 'loading' && tab.active) setTabVisual(tabId, false);
});
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) return;
  chrome.tabs.query({ active: true, windowId }).then(([tab]) => {
    if (tab?.id) syncMenu(tab.id);
  });
});
