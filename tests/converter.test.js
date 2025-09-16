// Note: TextConverter tests have been moved to tests/text-converter.test.js
const { DictionaryManager } = require('../background/dictionary-manager.js');
const { DOMManipulator } = require('../content/dom-manipulator.js');
const { JSDOM } = require('jsdom');
const { TextEncoder, TextDecoder } = require('util');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Manually mock the chrome API to return Promises
global.chrome = {
  storage: {
    sync: {
      get: jest.fn().mockResolvedValue({}),
      set: jest.fn().mockResolvedValue(undefined),
      clear: jest.fn().mockResolvedValue(undefined),
    },
  },
  runtime: {
    getURL: jest.fn(path => path),
  },
};

describe('DictionaryManager', () => {
  let dictManager;

  beforeEach(async () => {
    chrome.storage.sync.get.mockClear();
    chrome.storage.sync.set.mockClear();
    chrome.storage.sync.clear.mockClear();
    dictManager = new DictionaryManager();
    await dictManager.init();
  });

  test('新しい単語の登録', async () => {
    const result = await dictManager.addWord('漢字', 'かんじ', 'kanji');
    expect(result.reading).toBe('かんじ');
    expect(chrome.storage.sync.set).toHaveBeenCalled();
  });
});

describe('DOMManipulator', () => {
  test('処理対象ノードの正確な抽出', () => {
    const dom = new JSDOM('<!DOCTYPE html><p>こんにちは</p>');
    const manipulator = new DOMManipulator();
    const textNodes = manipulator.getTextNodes(dom.window.document.body);
    expect(textNodes.length).toBe(1);
    expect(textNodes[0].textContent).toBe('こんにちは');
  });
});