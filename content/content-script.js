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
      case 'CONVERT_FROM_WINGDINGS':
        const originalText = this.converter.convertFromWingdings(message.text);
        return { success: true, convertedText: originalText };
    }
  }
}

new MainContentScript();