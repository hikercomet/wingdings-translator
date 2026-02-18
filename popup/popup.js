class WingdingsPopup {
  constructor() {
    this.wingdingsMap = {}; // Initialize map
    this.autoConvertCheckbox = document.getElementById('autoConvertCheckbox');
    this.currentLang = 'ja'; // Default language
    this.bindEvents();
    this.loadWingdingsMap(); // Load map asynchronously
    this.getDictionaryStats();
    this.loadSettings(); // Load user settings
    this.initLanguage(); // Initialize language
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
    document.getElementById('langBtn').addEventListener('click', () => this.toggleLanguage());

    // Copy button event listeners
    document.getElementById('copyResultBtn').addEventListener('click', () => this.copyToClipboard('resultText', 'copyResultBtn'));
    document.getElementById('copyReverseResultBtn').addEventListener('click', () => this.copyToClipboard('reverseResultText', 'copyReverseResultBtn'));

    const inputText = document.getElementById('inputText');
    const charCount = document.getElementById('charCount');
    inputText.addEventListener('input', () => {
      const count = inputText.value.length;
      charCount.textContent = count;
      charCount.classList.toggle('warning', count > 600);
    });

    this.autoConvertCheckbox.addEventListener('change', () => {
      console.log('Popup: autoConvertCheckbox changed to', this.autoConvertCheckbox.checked);
      this.saveSettings();
    });
  }

  toKatakana(text) {
    return text.replace(/[\u3040-\u309F]/g, function(match) {
      const chr = match.charCodeAt(0) + 0x60;
      return String.fromCharCode(chr);
    });
  }

  async copyToClipboard(textElementId, buttonElementId) {
    const textElement = document.getElementById(textElementId);
    const buttonElement = document.getElementById(buttonElementId);
    
    if (!textElement || !textElement.textContent) {
      console.warn('No text to copy');
      return;
    }

    try {
      // Use the modern Clipboard API
      await navigator.clipboard.writeText(textElement.textContent);
      
      // Show visual feedback
      buttonElement.textContent = '✓ Copied!';
      buttonElement.classList.add('copied');
      
      // Reset after 2 seconds
      setTimeout(() => {
        buttonElement.textContent = '📋 Copy';
        buttonElement.classList.remove('copied');
      }, 2000);
      
      console.log('Text copied to clipboard successfully');
    } catch (err) {
      console.error('Failed to copy text:', err);
      
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = textElement.textContent;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        
        // Show visual feedback
        buttonElement.textContent = '✓ Copied!';
        buttonElement.classList.add('copied');
        
        setTimeout(() => {
          buttonElement.textContent = '📋 Copy';
          buttonElement.classList.remove('copied');
        }, 2000);
        
        console.log('Text copied using fallback method');
      } catch (fallbackErr) {
        console.error('Fallback copy also failed:', fallbackErr);
        buttonElement.textContent = '✗ Failed';
        setTimeout(() => {
          buttonElement.textContent = '📋 Copy';
        }, 2000);
      }
    }
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
            <span class="stat-label">${this.toKatakana('登録単語数')}:</span>
            <span class="stat-value">${stats.totalWords}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">${this.toKatakana('ストレージ使用率')}:</span>
            <span class="stat-value ${stats.storageUsage > 80 ? 'warning' : ''}">${stats.storageUsage}%</span>
          </div>
        `;
      } else {
        statsElement.textContent = this.toKatakana('統計の取得に失敗しました。');
      }
    } catch (error) {
      console.error('Error getting dictionary stats:', error);
      statsElement.textContent = this.toKatakana('エラーガハッセイシマシタ。');
    }
  }

  async loadSettings() {
    console.log('Popup: Loading settings...');
    try {
      const settings = await chrome.storage.sync.get('wingdingsSettings');
      this.autoConvertCheckbox.checked = settings.wingdingsSettings?.autoConvert ?? false; // Default to false
      this.currentLang = settings.wingdingsSettings?.language ?? 'ja'; // Default to Japanese
      console.log('Popup: Settings loaded. autoConvert:', this.autoConvertCheckbox.checked, 'language:', this.currentLang);
      console.log('Popup: Settings loaded. autoConvert:', this.autoConvertCheckbox.checked);

    } catch (e) {
      console.error('Popup: Error loading settings:', e);
    }
  }

  async saveSettings() {
    const autoConvert = this.autoConvertCheckbox.checked;
    const language = this.currentLang;
    console.log('Popup: Saving settings. autoConvert:', autoConvert, 'language:', language);
    try {
      await chrome.storage.sync.set({ wingdingsSettings: { autoConvert, language } });
      // Notify background script about the change
      const response = await chrome.runtime.sendMessage({ type: 'UPDATE_SETTINGS', settings: { autoConvert, language } });
      console.log('Popup: UPDATE_SETTINGS message sent. Response:', response);
    } catch (e) {
      console.error('Popup: Error saving settings:', e);
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

    // Check for 666 and trigger glitch effect
    if (text.includes('666')) {
      await this.triggerGlitchEffect();
    }

    // 1. Send text to content script for proper conversion (e.g., with Kuromoji)
    const response = await this.sendMessageToContentScript({ type: 'CONVERT_TEXT', text });

    if (response && response.success) {
      // 2. Take the result and convert it to actual Wingdings characters for copy-paste
      const wingdingsChars = this.asciiToWingdings(response.convertedText);

      const resultText = document.getElementById('resultText');
      resultText.textContent = wingdingsChars; // Set actual Wingdings characters
      resultText.style.fontFamily = "Wingdings, 'Wingdings 2', 'Wingdings 3', Webdings, Symbola, 'Segoe UI Symbol', 'Lucida Sans Unicode', monospace !important"; // Keep font-family for visual consistency
      resultText.style.fontSize = '28px';
      resultText.style.lineHeight = '1.2';
      document.getElementById('resultSection').style.display = 'block';
    }
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

  async triggerGlitchEffect() {
    const overlay = document.createElement('div');
    overlay.className = 'glitch-overlay';
    document.body.appendChild(overlay);

    // Play noise sound
    this.playNoiseSound();

    // Trigger animation
    setTimeout(() => overlay.classList.add('active'), 10);

    // Remove after animation
    setTimeout(() => {
      overlay.remove();
    }, 800);
  }

  playNoiseSound() {
    try {
      const audio = new Audio(chrome.runtime.getURL('assets/sounds/noise.mp3'));
      audio.volume = 0.3;
      audio.play().catch(err => {
        console.log('Could not play glitch sound:', err);
      });
    } catch (e) {
      console.log('Error loading glitch sound:', e);
    }
  }

  async initLanguage() {
    await this.updateUILanguage();
  }

  async toggleLanguage() {
    this.currentLang = this.currentLang === 'ja' ? 'en' : 'ja';
    await this.saveSettings();
    await this.updateUILanguage();
  }

  async updateUILanguage() {
    const langText = document.getElementById('langText');
    langText.textContent = this.currentLang === 'ja' ? 'JA' : 'EN';

    // Update UI text based on language
    if (this.currentLang === 'en') {
      document.getElementById('inputText').placeholder = 'ENTER TEXT TO CONVERT HERE (MAX 666 CHARS)';
      document.getElementById('convertBtn').textContent = 'CONVERT';
      document.getElementById('mappingBtn').textContent = 'CHART';
      document.querySelector('.result-box h4').textContent = 'RESULT:';
      document.querySelector('.section h3').textContent = 'WINGDINGS → TEXT';
      document.getElementById('wingdingsInput').placeholder = 'PASTE WINGDINGS HERE';
      document.getElementById('convertFromBtn').textContent = 'REVERSE CONVERT';
      document.querySelectorAll('.result-box h4')[1].textContent = 'REVERSE RESULT:';
      document.querySelector('.page-actions h3').textContent = 'PAGE ACTIONS';
      document.querySelector('.setting-item label').innerHTML = '<input type="checkbox" id="autoConvertCheckbox"> AUTO-CONVERT ON PAGE LOAD';
      document.getElementById('convertPageBtn').textContent = 'CONVERT ENTIRE PAGE';
      document.getElementById('revertPageBtn').textContent = 'REVERT';
      document.querySelector('.dictionary-section h3').textContent = 'PERSONAL DICTIONARY';
      document.getElementById('dictionaryBtn').textContent = 'MANAGE DICTIONARY';
      document.getElementById('helpLink').textContent = 'HELP';
      document.getElementById('aboutLink').textContent = 'ABOUT';
    } else {
      document.getElementById('inputText').placeholder = this.toKatakana('ここに変換したいテキストを入力してください（最大666文字）');
      document.getElementById('convertBtn').textContent = this.toKatakana('変換');
      document.getElementById('mappingBtn').textContent = this.toKatakana('対応表');
      document.querySelector('.result-box h4').textContent = this.toKatakana('変換結果:');
      document.querySelector('.section h3').textContent = 'Wingdings → ' + this.toKatakana('テキスト');
      document.getElementById('wingdingsInput').placeholder = this.toKatakana('ここにWingdingsを貼り付け');
      document.getElementById('convertFromBtn').textContent = this.toKatakana('逆変換');
      document.querySelectorAll('.result-box h4')[1].textContent = this.toKatakana('逆変換結果:');
      document.querySelector('.page-actions h3').textContent = this.toKatakana('ページ操作');
      document.querySelector('.setting-item label').innerHTML = '<input type="checkbox" id="autoConvertCheckbox"> ' + this.toKatakana('ページヨミコミジドウヘンカン');
      document.getElementById('convertPageBtn').textContent = this.toKatakana('ページ全体を変換');
      document.getElementById('revertPageBtn').textContent = this.toKatakana('元に戻す');
      document.querySelector('.dictionary-section h3').textContent = this.toKatakana('コジンジショ');
      document.getElementById('dictionaryBtn').textContent = this.toKatakana('ジショカンリ');
      document.getElementById('helpLink').textContent = this.toKatakana('ヘルプ');
      document.getElementById('aboutLink').textContent = this.toKatakana('アバウト');
    }

    // Re-bind the checkbox since we replaced the HTML
    this.autoConvertCheckbox = document.getElementById('autoConvertCheckbox');
    const settings = await chrome.storage.sync.get('wingdingsSettings');
    this.autoConvertCheckbox.checked = settings.wingdingsSettings?.autoConvert ?? false;
    this.autoConvertCheckbox.addEventListener('change', () => {
      console.log('Popup: autoConvertCheckbox changed to', this.autoConvertCheckbox.checked);
      this.saveSettings();
    });

    // Update dictionary stats with correct language
    await this.getDictionaryStats();
  }
}

document.addEventListener('DOMContentLoaded', () => new WingdingsPopup());