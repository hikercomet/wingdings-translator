class WingdingsPopup {
  constructor() {
    this.wingdingsMap = {}; // Initialize map
    this.autoConvertCheckbox = document.getElementById('autoConvertCheckbox');
    this.bindEvents();
    this.loadWingdingsMap(); // Load map asynchronously
    this.getDictionaryStats();
    this.loadSettings(); // Load user settings
  }

  bindEvents() {
    document.getElementById('convertBtn').addEventListener('click', () => this.convertText());
    document.getElementById('convertFromBtn').addEventListener('click', () => this.convertFromWingdings());
    document.getElementById('convertPageBtn').addEventListener('click', () => this.sendMessageToContentScript({ type: 'CONVERT_PAGE_REQUEST' }));
    document.getElementById('revertPageBtn').addEventListener('click', () => this.sendMessageToContentScript({ type: 'REVERT_PAGE_REQUEST' }));
    document.getElementById('dictionaryBtn').addEventListener('click', () => this.openSidePanel());
    document.getElementById('mappingBtn').addEventListener('click', () => this.openMappingTable());
    document.getElementById('helpLink').addEventListener('click', () => chrome.tabs.create({ url: chrome.runtime.getURL('assets/help.html') }));
    document.getElementById('aboutLink').addEventListener('click', () => chrome.tabs.create({ url: chrome.runtime.getURL('assets/about.html') }));

    const inputText = document.getElementById('inputText');
    const charCount = document.getElementById('charCount');
    inputText.addEventListener('input', () => {
      const count = inputText.value.length;
      charCount.textContent = count;
      charCount.classList.toggle('warning', count > 600);
    });

    this.autoConvertCheckbox.addEventListener('change', () => this.saveSettings());
  }

  async loadWingdingsMap() {
    try {
      const response = await fetch(chrome.runtime.getURL('data/wingdings-map.json'));
      const data = await response.json();
      this.wingdingsMap = data.ascii_to_wingdings;
    } catch (e) {
      console.error('Error loading wingdings-map.json:', e);
    }
  }

  asciiToWingdings(text) {
    if (!this.wingdingsMap || Object.keys(this.wingdingsMap).length === 0) {
      console.warn('Wingdings map not loaded yet.');
      return text; // Return original text if map isn't ready
    }
    return text.split('').map(char => this.wingdingsMap[char.toUpperCase()] || char).join('');
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

  async loadSettings() {
    try {
      const settings = await chrome.storage.sync.get('wingdingsSettings');
      this.autoConvertCheckbox.checked = settings.wingdingsSettings?.autoConvert ?? true; // Default to true
    } catch (e) {
      console.error('Error loading settings:', e);
    }
  }

  async saveSettings() {
    const autoConvert = this.autoConvertCheckbox.checked;
    try {
      await chrome.storage.sync.set({ wingdingsSettings: { autoConvert } });
      // Notify background script about the change
      await chrome.runtime.sendMessage({ type: 'UPDATE_SETTINGS', settings: { autoConvert } });
    } catch (e) {
      console.error('Error saving settings:', e);
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
    // Content script will still return the original text, but we convert it to actual Wingdings chars here
    // The content script's CONVERT_TEXT might be for on-page conversion, not for popup display.
    // For popup display, we directly convert using the map.
    const wingdingsChars = this.asciiToWingdings(text);

    const resultText = document.getElementById('resultText');
    resultText.textContent = wingdingsChars; // Set actual Wingdings characters
    resultText.style.fontFamily = "Wingdings, 'Wingdings 2', 'Wingdings 3', Webdings, Symbola, 'Segoe UI Symbol', 'Lucida Sans Unicode', monospace !important"; // Keep font-family for visual consistency
    resultText.style.fontSize = '28px';
    resultText.style.lineHeight = '1.2';
    document.getElementById('resultSection').style.display = 'block';
  }

  async convertFromWingdings() {
    const text = document.getElementById('wingdingsInput').value.trim();
    if (!text) return;
    const response = await this.sendMessageToContentScript({ type: 'CONVERT_FROM_WINGDINGS', text });
    if (response && response.success) {
      const reverseResultText = document.getElementById('reverseResultText');
      reverseResultText.textContent = response.convertedText;
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