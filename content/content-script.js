const { TextConverter } = require('./converter.js');
const { DOMManipulator } = require('./dom-manipulator.js');

class MainContentScript {
  constructor() {
    this.converter = null;
    this.domManipulator = null;
    this.init();
  }

  async init() {
    try {
      this.converter = new TextConverter();
      this.domManipulator = new DOMManipulator();
      this.setupListeners();
      // Initialize converter if needed for other messages, but don't auto-convert here
      // The auto-conversion logic is now handled by the background script based on user settings.
      // if (!this.converter.tokenizer) {
      //   await this.converter.init(chrome.runtime.getURL('data/dict/'));
      // }
      // this.domManipulator.convertPage(this.converter); // Removed auto-conversion
      console.log('Wingdings-Converter: Content script initialized. Awaiting commands.');
    } catch (e) {
      console.error('Wingdings-Converter: Content script initialization failed.', e);
    }
  }

  async ensureConverterInitialized() {
    if (!this.converter.tokenizer) {
      await this.converter.init(chrome.runtime.getURL('data/dict/'));
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
      case 'PAGE_LOADED': // This message is now used for conditional auto-conversion
      case 'CONVERT_PAGE_REQUEST':
        await this.ensureConverterInitialized();
        this.domManipulator.convertPage(this.converter);
        return { success: true };
      case 'REVERT_PAGE_REQUEST':
        this.domManipulator.revertPage();
        return { success: true };
      case 'CONVERT_TEXT':
        await this.ensureConverterInitialized();
        const convertedText = await this.converter.convert(message.text);
        return { success: true, convertedText };
      case 'CONVERT_FROM_WINGDINGS': {
        await this.ensureConverterInitialized();
        const originalText = this.converter.convertFromWingdings(message.text);
        return { success: true, convertedText: originalText };
      }
      case 'SHOW_WORD_REGISTRATION': {
        const kanji = message.selectedText;
        const reading = prompt(`Please enter the reading (in Hiragana) for "${kanji}":`);
        
        if (reading) {
          try {
            await this.ensureConverterInitialized();
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