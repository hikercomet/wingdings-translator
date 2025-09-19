/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!************************!*\
  !*** ./popup/popup.js ***!
  \************************/
class WingdingsPopup {
  constructor() {
    this.bindEvents();
  }

  bindEvents() {
    document.getElementById('convertBtn').addEventListener('click', () => this.convertText());
    document.getElementById('convertFromBtn').addEventListener('click', () => this.convertFromWingdings());
    document.getElementById('convertPageBtn').addEventListener('click', () => this.sendMessageToContentScript({ type: 'CONVERT_PAGE_REQUEST' }));
    document.getElementById('revertPageBtn').addEventListener('click', () => this.sendMessageToContentScript({ type: 'REVERT_PAGE_REQUEST' }));
  }

  async convertText() {
    const text = document.getElementById('inputText').value.trim();
    if (!text) return;
    const response = await this.sendMessageToContentScript({ type: 'CONVERT_TEXT', text });
    if (response && response.success) {
      document.getElementById('resultText').textContent = response.convertedText;
      document.getElementById('resultSection').style.display = 'block';
    }
  }

  async convertFromWingdings() {
    const text = document.getElementById('wingdingsInput').value.trim();
    if (!text) return;
    const response = await this.sendMessageToContentScript({ type: 'CONVERT_FROM_WINGDINGS', text });
    if (response && response.success) {
      document.getElementById('reverseResultText').textContent = response.convertedText;
      document.getElementById('reverseResultSection').style.display = 'block';
    }
  }

  async sendMessageToContentScript(message) {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab && tab.id) {
        return await chrome.tabs.sendMessage(tab.id, message);
      }
    } catch (e) {
      console.error("Could not send message to content script:", e);
    }
  }
}

document.addEventListener('DOMContentLoaded', () => new WingdingsPopup());

/******/ })()
;
//# sourceMappingURL=popup.js.map