export default defineBackground(() => {
  console.log('Hello background!', { id: browser.runtime.id });

  // Enable side panel on extension icon click
  browser.action.onClicked.addListener(async (tab) => {
    if (tab.id) {
      try {
        await browser.sidePanel.open({ tabId: tab.id });
      } catch (error) {
        console.error('Failed to open side panel:', error);
      }
    }
  });

  // Enable side panel for all tabs
  browser.runtime.onInstalled.addListener(() => {
    browser.sidePanel.setOptions({
      enabled: true
    });
  });
});
