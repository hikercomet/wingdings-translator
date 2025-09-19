const { TextConverter } = require('./converter.js');
const { DOMManipulator } = require('./dom-manipulator.js');

class MainContentScript {
  constructor() {
    this.init();
  }

  async init() {
    try {
      this.converter = new TextConverter();
      this.domManipulator = new DOMManipulator();
      await this.converter.init(chrome.runtime.getURL('data/dict/'));
      this.setupListeners();
      console.log('Wingdings-Converter: Content script is fully initialized.');
    } catch (e) {
      console.error('Wingdings-Converter: Initialization failed.', e);
    }
  }

  setupListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      this.handleMessage(message, sender).then(sendResponse);
      return true;
    });
  }

  async handleMessage(message, sender) {
    switch (message.type) {
      case 'CONVERT_PAGE_REQUEST':
        this.domManipulator.convertPage(this.converter);
        return { success: true };
      case 'REVERT_PAGE_REQUEST':
        this.domManipulator.revertPage();
        return { success: true };
      case 'CONVERT_TEXT':
        const convertedText = await this.converter.convert(message.text);
        return { success: true, convertedText };
      case 'CONVERT_FROM_WINGDINGS': {
        const originalText = this.converter.convertFromWingdings(message.text);
        return { success: true, convertedText: originalText };
      }
      case 'SHOW_WORD_REGISTRATION': {
        const kanji = message.selectedText;
        const reading = prompt(`「${kanji}」の読み仮名（ひらがな）を入力してください：`);
        
        if (reading) {
          try {
            const romaji = this.converter.convertToRomaji(reading);
            console.log('[Wingdings-Converter] Sending ADD_TO_DICTIONARY with:', { kanji, reading, romaji });
            const response = await chrome.runtime.sendMessage({
              type: 'ADD_TO_DICTIONARY',
              kanji,
              reading,
              romaji
            });
            if (response.success) {
              alert(`「${kanji}」を辞書に登録しました。`);
              // Optionally, re-convert the page to see the change
              this.domManipulator.revertPage();
              this.domManipulator.convertPage(this.converter);
            } else {
              alert(`辞書登録に失敗しました： ${response.error}`);
            }
          } catch (e) {
            console.error('Error adding word to dictionary:', e);
            alert(`辞書登録中にエラーが発生しました。`);
          }
        }
        return { success: true }; // Acknowledge message was handled
      }
    }
  }
}

new MainContentScript();