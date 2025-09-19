/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./background/dictionary-manager.js":
/*!******************************************!*\
  !*** ./background/dictionary-manager.js ***!
  \******************************************/
/***/ ((module) => {

class DictionaryManager {
  constructor() {
    this.STORAGE_KEY = 'wingdings_dictionary';
    this.MAX_ENTRIES = 5000;
    this.MAX_STORAGE_SIZE = 95 * 1024; // 95KB (100KB制限の95%)
    this.cache = new Map();
  }

  async init() {
    const data = await chrome.storage.sync.get(this.STORAGE_KEY);
    this.dictionary = data[this.STORAGE_KEY] || {
      words: {},
      settings: {
        autoConvert: false,
        showUnknownWords: true,
        romajiStyle: 'hepburn'
      },
      metadata: {
        version: '1.0',
        lastUpdate: Date.now(),
        entryCount: 0
      }
    };
    
    this.buildCache();
  }

  buildCache() {
    this.cache.clear();
    Object.entries(this.dictionary.words).forEach(([word, data]) => {
      this.cache.set(word, data);
    });
  }

  async addWord(kanji, reading, romaji = null) {
    // 容量チェック
    if (Object.keys(this.dictionary.words).length >= this.MAX_ENTRIES) {
      throw new Error(`Dictionary limit reached: ${this.MAX_ENTRIES} words`);
    }

    if (!romaji) {
      // Romaji must be provided by the caller.
      throw new Error('Romaji is required to add a word.');
    }

    const wordData = {
      reading: reading,
      romaji: romaji,
      frequency: 1,
      lastUsed: Date.now(),
      dateAdded: Date.now()
    };

    // 既存の単語は頻度更新
    if (this.dictionary.words[kanji]) {
      this.dictionary.words[kanji].frequency++;
      this.dictionary.words[kanji].lastUsed = Date.now();
    } else {
      this.dictionary.words[kanji] = wordData;
      this.dictionary.metadata.entryCount++;
    }

    this.dictionary.metadata.lastUpdate = Date.now();
    this.cache.set(kanji, wordData);

    await this.save();
    return wordData;
  }

  async removeWord(kanji) {
    if (this.dictionary.words[kanji]) {
      delete this.dictionary.words[kanji];
      this.cache.delete(kanji);
      this.dictionary.metadata.entryCount--;
      this.dictionary.metadata.lastUpdate = Date.now();
      await this.save();
      return true;
    }
    return false;
  }

  getWord(kanji) {
    return this.cache.get(kanji) || null;
  }

  async searchWords(query, limit = 50) {
    const results = [];
    const queryLower = query.toLowerCase();

    for (const [kanji, data] of this.cache.entries()) {
      if (results.length >= limit) break;
      
      if (kanji.includes(query) || 
          data.reading.includes(query) || 
          data.romaji.toLowerCase().includes(queryLower)) {
        results.push({
          kanji: kanji,
          ...data,
          relevance: this.calculateRelevance(query, kanji, data)
        });
      }
    }

    // 関連度でソート
    results.sort((a, b) => b.relevance - a.relevance);
    return results;
  }

  calculateRelevance(query, kanji, data) {
    let score = 0;
    
    // 完全一致
    if (kanji === query) score += 100;
    if (data.reading === query) score += 90;
    if (data.romaji === query.toLowerCase()) score += 80;
    
    // 前方一致
    if (kanji.startsWith(query)) score += 50;
    if (data.reading.startsWith(query)) score += 40;
    if (data.romaji.startsWith(query.toLowerCase())) score += 30;
    
    // 使用頻度
    score += Math.min(data.frequency, 50);
    
    // 最近使用
    const daysSinceUse = (Date.now() - data.lastUsed) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 30 - daysSinceUse);
    
    return score;
  }

  async save() {
    const serialized = JSON.stringify(this.dictionary);
    const size = new Blob([serialized]).size;
    
    if (size > this.MAX_STORAGE_SIZE) {
      // 自動クリーンアップ：古い&低頻度の単語を削除
      await this.cleanup();
    }

    await chrome.storage.sync.set({
      [this.STORAGE_KEY]: this.dictionary
    });

    console.log(`Dictionary saved: ${this.dictionary.metadata.entryCount} words, ${size} bytes`);
  }

  async cleanup() {
    const words = Object.entries(this.dictionary.words);
    
    // スコア計算（頻度 + 最近使用）
    const scored = words.map(([kanji, data]) => ({
      kanji,
      data,
      score: data.frequency + Math.max(0, 30 - (Date.now() - data.lastUsed) / (1000 * 60 * 60 * 24))
    }));

    // スコアでソートし、下位25%を削除
    scored.sort((a, b) => a.score - b.score);
    const toDelete = scored.slice(0, Math.floor(scored.length * 0.25));

    toDelete.forEach(item => {
      delete this.dictionary.words[item.kanji];
      this.cache.delete(item.kanji);
    });

    this.dictionary.metadata.entryCount = Object.keys(this.dictionary.words).length;
    console.log(`Cleaned up ${toDelete.length} words from dictionary`);
  }

  async exportDictionary() {
    const exportData = {
      ...this.dictionary,
      exportDate: Date.now(),
      version: chrome.runtime.getManifest().version
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    return blob;
  }

  async importDictionary(jsonData) {
    try {
      const importedData = JSON.parse(jsonData);
      
      // バリデーション
      if (!importedData.words || typeof importedData.words !== 'object') {
        throw new Error('Invalid dictionary format');
      }

      // マージまたは置換
      const choice = await this.showImportDialog(Object.keys(importedData.words).length);
      
      if (choice === 'replace') {
        this.dictionary.words = importedData.words;
      } else if (choice === 'merge') {
        Object.assign(this.dictionary.words, importedData.words);
      }

      this.dictionary.metadata.entryCount = Object.keys(this.dictionary.words).length;
      this.dictionary.metadata.lastUpdate = Date.now();
      
      this.buildCache();
      await this.save();
      
      return {
        success: true,
        imported: Object.keys(importedData.words).length,
        total: this.dictionary.metadata.entryCount
      };
    } catch (error) {
      console.error('Import failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  getStatistics() {
    const words = Object.values(this.dictionary.words);
    const now = Date.now();
    
    return {
      totalWords: words.length,
      averageFrequency: words.reduce((sum, w) => sum + w.frequency, 0) / words.length,
      mostUsedWord: words.reduce((max, w) => w.frequency > max.frequency ? w : max, words[0]),
      recentlyAdded: words.filter(w => now - w.dateAdded < 7 * 24 * 60 * 60 * 1000).length,
      storageUsage: Math.round((new Blob([JSON.stringify(this.dictionary)]).size / this.MAX_STORAGE_SIZE) * 100),
      lastUpdate: new Date(this.dictionary.metadata.lastUpdate).toLocaleString()
    };
  }
}

module.exports = { DictionaryManager };

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
/*!**************************************!*\
  !*** ./background/service-worker.js ***!
  \**************************************/
const { DictionaryManager } = __webpack_require__(/*! ./dictionary-manager.js */ "./background/dictionary-manager.js");

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
})();

/******/ })()
;
//# sourceMappingURL=service-worker.js.map