/******/ (() => { // webpackBootstrap
var __webpack_exports__ = {};
/*!************************!*\
  !*** ./popup/popup.js ***!
  \************************/
class WingdingsPopup {
  constructor() {
    this.converter = null;
    this.isConverting = false;
    this.init();
  }

  async init() {
    await this.initializeConverter();
    this.bindEvents();
    await this.updateDictionaryStats();
    this.updateCharCount();
  }

  async initializeConverter() {
    // TextConverterをインポート
    this.converter = new TextConverter();
    await this.converter.init();
  }

  bindEvents() {
    // 文字数カウント
    const inputText = document.getElementById('inputText');
    inputText.addEventListener('input', () => this.updateCharCount());

    // 変換ボタン
    document.getElementById('convertBtn').addEventListener('click', () => this.convertText());

    // 対応表ボタン
    document.getElementById('mappingBtn').addEventListener('click', () => this.showMapping());

    // コピーボタン
    document.getElementById('copyBtn').addEventListener('click', () => this.copyResult());

    // ページ操作ボタン
    document.getElementById('convertPageBtn').addEventListener('click', () => this.convertCurrentPage());
    document.getElementById('revertPageBtn').addEventListener('click', () => this.revertCurrentPage());

    // 辞書管理ボタン
    document.getElementById('dictionaryBtn').addEventListener('click', () => this.openDictionary());

    // ヘルプ・アバウト
    document.getElementById('helpLink').addEventListener('click', () => this.showHelp());
    document.getElementById('aboutLink').addEventListener('click', () => this.showAbout());

    // エンターキーで変換
    inputText.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.convertText();
      }
    });
  }

  updateCharCount() {
    const inputText = document.getElementById('inputText');
    const charCount = document.getElementById('charCount');
    const currentLength = inputText.value.length;
    
    charCount.textContent = currentLength;
    charCount.className = currentLength > 600 ? 'warning' : '';
  }

  async convertText() {
    if (this.isConverting) return;
    
    const inputText = document.getElementById('inputText');
    const convertBtn = document.getElementById('convertBtn');
    const resultSection = document.getElementById('resultSection');
    const resultText = document.getElementById('resultText');
    
    const text = inputText.value.trim();
    if (!text) {
      this.showNotification('テキストを入力してください', 'warning');
      return;
    }

    try {
      this.isConverting = true;
      convertBtn.textContent = ' 変換中...';
      convertBtn.disabled = true;

      const startTime = performance.now();
      const result = await this.converter.convert(text);
      const endTime = performance.now();

      resultText.textContent = result;
      resultSection.style.display = 'block';
      
      // 変換時間を表示
      const duration = Math.round(endTime - startTime);
      this.showNotification(`変換完了 (${duration}ms)`, 'success');

      // ガスター効果音再生
      await chrome.runtime.sendMessage({
        type: 'PLAY_SOUND',
        soundId: '_convert'
      });

    } catch (error) {
      console.error('Conversion error:', error);
      this.showNotification('変換に失敗しました', 'error');
      resultSection.style.display = 'none';
    } finally {
      this.isConverting = false;
      convertBtn.textContent = ' 変換';
      convertBtn.disabled = false;
    }
  }

  async copyResult() {
    const resultText = document.getElementById('resultText');
    
    try {
      await navigator.clipboard.writeText(resultText.textContent);
      this.showNotification('コピーしました', 'success');
      
      // コピーボタンのアニメーション
      const copyBtn = document.getElementById('copyBtn');
      copyBtn.textContent = '✅ コピー済み';
      setTimeout(() => {
        copyBtn.textContent = ' コピー';
      }, 2000);
    } catch (error) {
      console.error('Copy failed:', error);
      this.showNotification('コピーに失敗しました', 'error');
    }
  }

  async convertCurrentPage() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.runtime.sendMessage({
        type: 'CONVERT_PAGE',
        tabId: tab.id
      });
      this.showNotification('ページ変換を開始しました', 'success');
      window.close();
    } catch (error) {
      this.showNotification('ページ変換に失敗しました', 'error');
    }
  }

  async revertCurrentPage() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      await chrome.runtime.sendMessage({
        type: 'REVERT_PAGE',
        tabId: tab.id
      });
      this.showNotification('元に戻しました', 'success');
      window.close();
    } catch (error) {
      this.showNotification('元に戻すことに失敗しました', 'error');
    }
  }

  async updateDictionaryStats() {
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'GET_STATISTICS'
      });
      
      if (response.success) {
        const stats = response.statistics;
        const statsElement = document.getElementById('dictStats');
        statsElement.innerHTML = `
          <div class="stat-item">
            <span class="stat-label">登録語数:</span>
            <span class="stat-value">${stats.totalWords.toLocaleString()}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">容量使用率:</span>
            <span class="stat-value ${stats.storageUsage > 90 ? 'warning' : ''}">${stats.storageUsage}%</span>
          </div>
        `;
      }
    } catch (error) {
      console.error('Failed to get dictionary stats:', error);
    }
  }

  async showMapping() {
    await chrome.tabs.create({
      url: chrome.runtime.getURL('assets/mapping-table.html')
    });
    window.close();
  }

  async openDictionary() {
    await chrome.sidePanel.open({ tabId: (await chrome.tabs.query({ active: true, currentWindow: true }))[0].id });
    window.close();
  }

  showHelp() {
    chrome.tabs.create({
      url: chrome.runtime.getURL('help.html')
    });
    window.close();
  }

  showAbout() {
    const aboutContent = `
 Wingdings変換ツール v1.0.0

Undertaleのガスターをイメージした、日本語・英語をWingdingsフォントに変換するChrome拡張機能です。

【主な機能】
• リアルタイム文字変換
• ページ全体一括変換
• 個人辞書登録・管理
• クロスプラットフォーム対応

【開発者】
WingdingsDev Team

【ライセンス】
MIT License
    `;
    
    alert(aboutContent);
  }

  showNotification(message, type = 'info') {
    // 既存の通知があれば削除
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);

    // 3秒後に自動削除
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }
}

// TextConverterクラス（簡易版）
class TextConverter {
  constructor() {
    this.tokenizer = null;
    this.wingdingsMap = null;
    this.emojiMap = null;
  }

  async init() {
    // Wingdingsマップ読み込み
    const mapResponse = await fetch(chrome.runtime.getURL('data/wingdings-map.json'));
    const mapData = await mapResponse.json();
    this.wingdingsMap = mapData.ascii_to_wingdings;
    this.emojiMap = mapData.emoji_fallback;
  }

  async convert(text) {
    let result = '';
    
    // 文字ごとに処理
    for (let char of text) {
      if (this.isJapanese(char)) {
        // 日本語の場合は簡易変換（実際はKuromoji使用）
        const romaji = this.simpleKanaToRomaji(char);
        result += this.convertToWingdings(romaji);
      } else if (this.isEnglish(char)) {
        result += this.convertToWingdings(char.toUpperCase());
      } else {
        result += char; // その他の文字はそのまま
      }
    }
    
    return result;
  }

  isJapanese(char) {
    const code = char.charCodeAt(0);
    return (code >= 0x3040 && code <= 0x309F) || // ひらがな
           (code >= 0x30A0 && code <= 0x30FF) || // カタカナ
           (code >= 0x4E00 && code <= 0x9FAF);   // 漢字
  }

  isEnglish(char) {
    return /[A-Za-z]/.test(char);
  }

  convertToWingdings(char) {
    // フォント対応チェック（簡易版）
    const isWingdingsSupported = this.checkWingdingsSupport();
    
    if (isWingdingsSupported && this.wingdingsMap[char]) {
      return this.wingdingsMap[char];
    } else if (this.emojiMap[char]) {
      return this.emojiMap[char];
    }
    
    return char;
  }

  checkWingdingsSupport() {
    // 簡易的なフォント対応チェック
    return navigator.platform.indexOf('Win') !== -1;
  }

  simpleKanaToRomaji(char) {
    const kanaMap = {
      'あ': 'A', 'い': 'I', 'う': 'U', 'え': 'E', 'お': 'O',
      'か': 'K', 'き': 'K', 'く': 'K', 'け': 'K', 'こ': 'K',
      // 簡易マッピング（実際はより詳細）
    };
    
    return kanaMap[char] || char.toUpperCase();
  }
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  new WingdingsPopup();
});
/******/ })()
;
//# sourceMappingURL=popup.js.map