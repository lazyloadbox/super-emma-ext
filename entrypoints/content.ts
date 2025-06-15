import TurndownService from 'turndown';

export default defineContentScript({
  matches: ['<all_urls>'],
  main() {
    console.log('Hello content.');

    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (msg.type === 'GET_PAGE_MARKDOWN') {
        const turndownService = new TurndownService();
        const markdown = turndownService.turndown(document.body.outerHTML);
        sendResponse({ markdown });
      }
      return true;
    });
  },
});
