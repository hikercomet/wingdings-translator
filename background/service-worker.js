const { DictionaryManager } = require('./dictionary-manager.js');

// Service Worker - Background処理
class WingdingsBackground {
  constructor() {
    this.dictionaryManager = new DictionaryManager();
    this.settings = {
      autoConvert: true, // Default to true
    };
    this.init();
  }

  async init() {
    await this.dictionaryManager.init();
    await this.loadSettings(); // Load settings on init
    this.setupContextMenus();
    this.setupMessageHandlers();
    this.setupTabHandlers();
  }

  async loadSettings() {
    console.log('Background: Loading settings...');
    try {
      const storedSettings = await chrome.storage.sync.get('wingdingsSettings');
      this.settings.autoConvert = storedSettings.wingdingsSettings?.autoConvert ?? true;
      console.log('Background: Settings loaded. autoConvert:', this.settings.autoConvert);
    } catch (e) {
      console.error('Background: Error loading settings:', e);
    }
  }

  async saveSettings(newSettings) {
    this.settings = { ...this.settings, ...newSettings };
    console.log('Background: Saving settings. autoConvert:', this.settings.autoConvert);
    try {
      await chrome.storage.sync.set({ wingdingsSettings: this.settings });
    } catch (e) {
      console.error('Background: Error saving settings:', e);
    }
  }

  setupContextMenus() {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: 'wingdings-convert-page',
        title: 'ページゼンタイヲWINGDINGSニヘンカン',
        contexts: ['page']
      });

        chrome.contextMenus.create({
          id: 'REVERT_PAGE_REQUEST',
          title: 'モトニモドス',
          contexts: ['page']
        });
        chrome.contextMenus.create({
          id: 'CONVERT_SELECTION_FROM_WINGDINGS',
          title: 'センタクハンイヲテキストニヘンカン',
          contexts: ['selection']
        });
      chrome.contextMenus.create({
        id: 'wingdings-add-word',
        title: 'センタクモジヲジショニトウロク "%s"',
        contexts: ['selection']
      });

      chrome.contextMenus.create({
        id: 'wingdings-show-mapping',
        title: 'WINGDINGSタイオウヒョウヲヒョウジ',
        contexts: ['page']
      });
    });
  }

  setupMessageHandlers() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender, sendResponse);
      return true; // 非同期レスポンス用
    });
  }

  async handleMessage(message, sender, sendResponse) {
    try {
      const tabId = message.tabId || sender.tab?.id;

      switch (message.type) {
        case 'CONVERT_PAGE':
          await this.convertPage(tabId);
          sendResponse({ success: true });
          break;

        case 'REVERT_PAGE':
          await this.revertPage(tabId);
          sendResponse({ success: true });
          break;

        case 'ADD_TO_DICTIONARY':
          const result = await this.dictionaryManager.addWord(
            message.kanji,
            message.reading,
            message.romaji
          );
          sendResponse({ success: true, data: result });
          break;

        case 'SEARCH_DICTIONARY':
          console.log('Background: Received SEARCH_DICTIONARY message. Query:', message.query);
          const searchResults = await this.dictionaryManager.searchWords(
            message.query,
            message.limit || 50
          );
          console.log('Background: Search results from DictionaryManager:', searchResults);
          sendResponse({ success: true, results: searchResults });
          break;

        case 'REMOVE_FROM_DICTIONARY':
          const removeResult = await this.dictionaryManager.removeWord(message.kanji);
          sendResponse({ success: removeResult });
          break;

        case 'GET_STATISTICS':
          const stats = this.dictionaryManager.getStatistics();
          sendResponse({ success: true, statistics: stats });
          break;

        case 'GET_USER_DICTIONARY':
          const userDictionary = this.dictionaryManager.dictionary.words;
          sendResponse({ success: true, dictionary: userDictionary });
          break;

        case 'UPDATE_SETTINGS': // New case for updating settings
          console.log('Background: Received UPDATE_SETTINGS message. Settings:', message.settings);
          await this.saveSettings(message.settings);
          sendResponse({ success: true });
          break;

        case 'PLAY_SOUND':
          this.playSound(message.soundId);
          sendResponse({ success: true });
          break;

        default:
          sendResponse({ success: false, error: 'Unknown message type' });
      }
    } catch (error) {
      console.error('Message handling error:', error);
      sendResponse({ success: false, error: error.message });
    }
  }

  setupTabHandlers() {
    // タブ更新時の処理
    chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
      if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
        console.log('Background: Tab updated. autoConvert setting:', this.settings.autoConvert);
        // Check autoConvert setting before sending PAGE_LOADED
        if (this.settings.autoConvert) {
          try {
            await chrome.tabs.sendMessage(tabId, {
              type: 'PAGE_LOADED',
              url: tab.url
            });
          } catch (error) {
            // Content script が読み込まれていない場合は無視
            console.log('Content script not ready for tab:', tabId);
          }
        }
      }
    });

    // アクティブタブ変更時の処理
    chrome.tabs.onActivated.addListener(async (activeInfo) => {
      await this.updateBadge(activeInfo.tabId);
    });
  }

  async convertPage(tabId) {
    await chrome.tabs.sendMessage(tabId, {
      type: 'CONVERT_PAGE_REQUEST'
    });
    
    await this.updateBadge(tabId, 'ON');
  }

  async revertPage(tabId) {
    await chrome.tabs.sendMessage(tabId, {
      type: 'REVERT_PAGE_REQUEST'
    });
    
    await this.updateBadge(tabId, '');
  }

  async updateBadge(tabId, text = '') {
    await chrome.action.setBadgeText({
      tabId: tabId,
      text: text
    });
    
    await chrome.action.setBadgeBackgroundColor({
      tabId: tabId,
      color: text === 'ON' ? '#4CAF50' : '#FF9800'
    });
  }

  playSound(soundId = '1') {
    // 効果音再生（Audio APIを使用）
    const audio = new Audio(chrome.runtime.getURL(`assets/sounds/${soundId}.mp3`));
    audio.volume = 0.3;
    audio.play().catch(error => {
      console.log('Sound play failed:', error);
    });
  }
}

// 初期化
const wingdingsBackground = new WingdingsBackground();

// Context Menu クリック処理
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  switch (info.menuItemId) {
    case 'wingdings-convert-page':
      await wingdingsBackground.convertPage(tab.id);
      break;

    case 'REVERT_PAGE_REQUEST':
      await wingdingsBackground.revertPage(tab.id);
      break;

    case 'CONVERT_SELECTION_FROM_WINGDINGS':
      if (info.selectionText) {
        try {
          const response = await chrome.tabs.sendMessage(tab.id, {
            type: 'CONVERT_FROM_WINGDINGS',
            text: info.selectionText
          });
          if (response && response.success) {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: (text) => { alert('変換結果:\n\n' + text); },
              args: [response.convertedText]
            });
          }
        } catch (e) {
          console.error('Error converting selection from Wingdings:', e);
        }
      }
      break;

    case 'wingdings-add-word':
      if (info.selectionText) {
        // 選択されたテキストを辞書登録UIに送信
        await chrome.tabs.sendMessage(tab.id, {
          type: 'SHOW_WORD_REGISTRATION',
          selectedText: info.selectionText.trim()
        });
      }
      break;

    case 'wingdings-show-mapping':
      await chrome.tabs.create({
        url: chrome.runtime.getURL('assets/mapping-table.html')
      });
      break;
  }
});