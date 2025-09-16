const { TextConverter } = require('./converter.js');
const { DOMManipulator } = require('./dom-manipulator.js');

class MainContentScript {
  constructor() {
    this.converter = new TextConverter();
    this.domManipulator = new DOMManipulator(this.converter); // Pass converter instance
    this.init();
  }

  async init() {
    console.log('Wingdings-Converter: Content script loaded.');
    try {
      const dicPath = chrome.runtime.getURL('data/dict/');
      const mapPath = chrome.runtime.getURL('data/wingdings-map.json');
      await this.converter.init(dicPath, mapPath);
      this.setupListeners();
      console.log('Wingdings-Converter: Ready to convert.');
    } catch (e) {
      console.error('Wingdings-Converter: Initialization failed.', e);
    }
  }

  setupListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'CONVERT_PAGE_REQUEST') {
        console.log('Wingdings-Converter: Received CONVERT_PAGE_REQUEST');
        this.domManipulator.convertPage();
        sendResponse({ success: true });
      } else if (message.type === 'REVERT_PAGE_REQUEST') {
        this.domManipulator.revertPage();
        sendResponse({ success: true });
      }
      return true;
    });
  }
}

new MainContentScript();
