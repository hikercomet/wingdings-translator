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
        const reading = prompt(`Please enter the reading (in Hiragana) for "${kanji}":`);
        
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
              alert(`Added "${kanji}" to the dictionary.`);
              this.domManipulator.revertPage();
              this.domManipulator.convertPage(this.converter);
            } else {
              alert(`Failed to add word to dictionary: ${response.error}`);
            }
          } catch (e) {
            console.error('Error adding word to dictionary:', e);
            alert('An error occurred while adding the word.');
          }
        }
        return { success: true }; // Acknowledge message was handled
      }
    }
  }
}

new MainContentScript();