const { DictionaryManager } = require('./dictionary-manager.js');

// Service Worker - Background処理
class WingdingsBackground {
  constructor() {
    this.dictionaryManager = new DictionaryManager();
    this.init();
  }

  async init() {
    await this.dictionaryManager.init();
    this.setupContextMenus();
    this.setupMessageHandlers();
    this.setupTabHandlers();
  }

  setupContextMenus() {
    chrome.contextMenus.removeAll(() => {
      chrome.contextMenus.create({
        id: 'wingdings-convert-page',
        title: ' ページ全体をWingdingsに変換',
        contexts: ['page']
      });

        chrome.contextMenus.create({
          id: 'REVERT_PAGE_REQUEST',
          title: '↩️ 元に戻す',
          contexts: ['page']
        });
        chrome.contextMenus.create({
          id: 'CONVERT_SELECTION_FROM_WINGDINGS',
          title: '選択範囲をテキストに変換',
          contexts: ['selection']
        });
      chrome.contextMenus.create({
        id: 'wingdings-add-word',
        title: '➕ 選択文字を辞書に登録 "%s"',
        contexts: ['selection']
      });

      chrome.contextMenus.create({
        id: 'wingdings-show-mapping',
        title: ' Wingdings対応表を表示',
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

      if (!tabId) {
        // In some cases, like the initial popup load, there's no target tab.
        // We can ignore these messages or handle them gracefully.
        if (message.type === 'GET_STATISTICS') {
            const stats = this.dictionaryManager.getStatistics();
            sendResponse({ success: true, statistics: stats });
        }
        return;
      }

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
          const searchResults = await this.dictionaryManager.searchWords(
            message.query,
            message.limit || 50
          );
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

        case 'EXPORT_DICTIONARY':
          const blob = await this.dictionaryManager.exportDictionary();
          const url = URL.createObjectURL(blob);
          await chrome.downloads.download({
            url: url,
            filename: `wingdings-dictionary-${Date.now()}.json`,
            saveAs: true
          });
          sendResponse({ success: true });
          break;

        case 'PLAY_SOUND':
          this.playGasterSound(message.soundId);
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

  playGasterSound(soundId = 'gaster1') {
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

    case 'wingdings-revert-page':
      await wingdingsBackground.revertPage(tab.id);
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