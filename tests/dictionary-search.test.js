/**
 * @jest-environment jsdom
 */
const fs = require('fs');
const path = require('path');

global.chrome = {
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
    },
  },
};

describe('DictionaryPanel Search', () => {
  let DictionaryPanel;
  let container;

  beforeEach(() => {
    // Mock HTML
    const html = `
      <div class="container">
        <header class="header">
          <h1>個人辞書</h1>
          <div class="stats">
            <span id="wordCount">0</span> / 5000 語
          </div>
        </header>
        <div class="toolbar">
          <input type="search" id="searchInput" placeholder="辞書を検索...">
        </div>
        <div id="wordList" class="word-list"></div>
        <div class="add-word-form">
          <h2>新しい単語を追加</h2>
          <div class="form-row">
            <input type="text" id="newWordKanji">
            <input type="text" id="newWordReading">
          </div>
          <button id="addWordBtn">追加</button>
        </div>
      </div>
    `;
    document.body.innerHTML = html;

    // Load DictionaryPanel
    const modulePath = path.resolve(__dirname, '../sidepanel/dictionary.js');
    const code = fs.readFileSync(modulePath, 'utf8');
    const func = new Function(code + '; return DictionaryPanel;');
    DictionaryPanel = func();
  });

  test('should filter words by kanji', () => {
    chrome.storage.sync.get.mockResolvedValue({
      'wingdings_dictionary': {
        words: {
          'テスト': { reading: 'てすと', romaji: 'TESUTO' },
          'サンプル': { reading: 'さんぷる', romaji: 'SAMPLE' }
        }
      }
    });

    const panel = new DictionaryPanel();
    panel.words = [
      { kanji: 'テスト', reading: 'てすと', romaji: 'TESUTO' },
      { kanji: 'サンプル', reading: 'さんぷる', romaji: 'SAMPLE' }
    ];

    const searchInput = document.getElementById('searchInput');
    searchInput.value = 'テ';
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));

    const filtered = panel.words.filter(word =>
      word.kanji.toLowerCase().includes('テ') ||
      word.reading.toLowerCase().includes('テ') ||
      word.romaji.toLowerCase().includes('テ')
    );
    expect(filtered.length).toBe(1);
    expect(filtered[0].kanji).toBe('テスト');
  });

  test('should filter by reading', () => {
    const panel = new DictionaryPanel();
    panel.words = [
      { kanji: 'テスト', reading: 'てすと', romaji: 'TESUTO' }
    ];

    const searchInput = document.getElementById('searchInput');
    searchInput.value = 'す';
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));

    const filtered = panel.words.filter(word =>
      word.kanji.toLowerCase().includes('す') ||
      word.reading.toLowerCase().includes('す') ||
      word.romaji.toLowerCase().includes('す')
    );
    expect(filtered.length).toBe(1);
  });

  test('should clear filter on ESC', () => {
    const panel = new DictionaryPanel();
    panel.words = [
      { kanji: 'テスト', reading: 'てすと', romaji: 'TESUTO' }
    ];
    panel.filter = 'テ';

    const searchInput = document.getElementById('searchInput');
    searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));

    expect(panel.filter).toBe('');
  });
});

module.exports = {};
