/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!************************!*\
  !*** ./popup/popup.js ***!
  \************************/
class WingdingsPopup {
  constructor() {
    this.bindEvents();
    this.getDictionaryStats();
  }

  bindEvents() {
    document.getElementById('convertBtn').addEventListener('click', () => this.convertText());
    document.getElementById('convertFromBtn').addEventListener('click', () => this.convertFromWingdings());
    document.getElementById('convertPageBtn').addEventListener('click', () => this.sendMessageToContentScript({ type: 'CONVERT_PAGE_REQUEST' }));
    document.getElementById('revertPageBtn').addEventListener('click', () => this.sendMessageToContentScript({ type: 'REVERT_PAGE_REQUEST' }));
    document.getElementById('dictionaryBtn').addEventListener('click', () => this.openSidePanel());
    document.getElementById('mappingBtn').addEventListener('click', () => this.openMappingTable());

    const inputText = document.getElementById('inputText');
    const charCount = document.getElementById('charCount');
    inputText.addEventListener('input', () => {
      const count = inputText.value.length;
      charCount.textContent = count;
      charCount.classList.toggle('warning', count > 600);
    });
  }

  async getDictionaryStats() {
    const statsElement = document.getElementById('dictStats');
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_STATISTICS' });
      if (response && response.success) {
        const stats = response.statistics;
        statsElement.innerHTML = `
          <div class="stat-item">
            <span class="stat-label">登録単語数:</span>
            <span class="stat-value">${stats.totalWords}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">ストレージ使用率:</span>
            <span class="stat-value ${stats.storageUsage > 80 ? 'warning' : ''}">${stats.storageUsage}%</span>
          </div>
        `;
      } else {
        statsElement.textContent = '統計の取得に失敗しました。';
      }
    } catch (error) {
      console.error('Error getting dictionary stats:', error);
      statsElement.textContent = 'エラーが発生しました。';
    }
  }

  async openSidePanel() {
    try {
      await chrome.sidePanel.open({ windowId: (await chrome.windows.getCurrent()).id });
    } catch (e) {
      console.error("Error opening side panel:", e);
    }
  }
  
  async openMappingTable() {
    await chrome.tabs.create({ url: chrome.runtime.getURL('assets/mapping-table.html') });
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