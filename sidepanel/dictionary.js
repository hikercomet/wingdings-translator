class DictionaryPanel {
  constructor() {
    this.wordListEl = document.getElementById('wordList');
    this.searchInputEl = document.getElementById('searchInput');
    this.addWordBtnEl = document.getElementById('addWordBtn');
    this.newWordKanjiEl = document.getElementById('newWordKanji');
    this.newWordReadingEl = document.getElementById('newWordReading');
    this.wordCountEl = document.getElementById('wordCount');

    this.currentQuery = '';
    this.debouncedSearch = this.debounce(this.performSearch.bind(this), 250);

    this.init();
  }

  async init() {
    this.bindEvents();
    await this.loadInitialData();
  }

  bindEvents() {
    this.searchInputEl.addEventListener('input', (e) => {
      this.currentQuery = e.target.value;
      console.log('Sidepanel: Search input changed. Query:', this.currentQuery);
      this.debouncedSearch(this.currentQuery);
    });

    this.addWordBtnEl.addEventListener('click', () => this.addWord());
    this.wordListEl.addEventListener('click', (e) => {
      if (e.target.classList.contains('delete-btn')) {
        this.deleteWord(e.target.dataset.kanji);
      }
    });
  }

  toKatakana(text) {
    return text.replace(/[\u3040-\u309F]/g, function(match) {
      const chr = match.charCodeAt(0) + 0x60;
      return String.fromCharCode(chr);
    });
  }

  async loadInitialData() {
    console.log('Sidepanel: Loading initial data...');
    try {
      // 統計情報を取得して総単語数を更新
      const statsResponse = await chrome.runtime.sendMessage({ type: 'GET_STATISTICS' });
      if (statsResponse && statsResponse.success) {
        this.wordCountEl.textContent = statsResponse.statistics.totalWords;
        console.log('Sidepanel: Dictionary stats loaded:', statsResponse.statistics);
      }
      // 初期表示として空クエリで検索（最近使った順などで表示される）
      await this.performSearch('');
    } catch (e) {
      console.error('Sidepanel: Error loading initial data:', e);
      this.wordListEl.innerHTML = `<div class="word-item">${this.toKatakana('データノヨミコミチュウニエラーガハッセイシマシタ。')}</div>`;
    }
  }

  async performSearch(query) {
    console.log('Sidepanel: Performing search for query:', query);
    try {
      const response = await chrome.runtime.sendMessage({
        type: 'SEARCH_DICTIONARY',
        query: query
      });

      if (response && response.success) {
        console.log('Sidepanel: Search response received:', response.results);
        this.renderWordList(response.results);
      } else {
        console.error('Sidepanel: Search failed. Response:', response);
        throw new Error(response?.error || 'SEARCH FAILED');
      }
    } catch (e) {
      console.error('Sidepanel: Error performing search:', e);
      this.wordListEl.innerHTML = `<div class="word-item">${this.toKatakana('ケンサクチュウニエラーガハッセイシマシタ。')}</div>`;
    }
  }

  renderWordList(words) {
    this.wordListEl.innerHTML = '';

    if (words.length === 0) {
      this.wordListEl.innerHTML = `<div class="word-item">${this.toKatakana('ガイタウスルタンゴハアリマセン。')}</div>`;
      return;
    }

    for (const word of words) {
      const itemEl = document.createElement('div');
      itemEl.className = 'word-item';
      itemEl.innerHTML = `
          <div class="word-display">
              <span class="word-kanji">${word.kanji}</span>
              <span class="word-reading">${word.reading} (${word.romaji.toUpperCase()})</span>
          </div>
          <button class="delete-btn" data-kanji="${word.kanji}">${this.toKatakana('サクジョ')}</button>
      `;
      this.wordListEl.appendChild(itemEl);
    }
  }

  async addWord() {
    const kanji = this.newWordKanjiEl.value.trim();
    const reading = this.newWordReadingEl.value.trim();

    if (!kanji || !reading) {
      alert(this.toKatakana('タンゴトヨミヲリョウホウニュウリョクシテクダサイ。'));
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'ADD_TO_DICTIONARY',
        kanji: kanji,
        reading: reading
      });

      if (response && response.success) {
        this.newWordKanjiEl.value = '';
        this.newWordReadingEl.value = '';
        // データを再読み込みして表示を更新
        await this.loadInitialData();
      } else {
        alert(this.toKatakana('タンゴノツイカニシッパイシマシタ:') + response?.error);
      }
    } catch (e) {
      console.error('Error adding word:', e);
      alert(this.toKatakana('タンゴノツイカチュウニエラーガハッセイシマシタ。'));
    }
  }

  async deleteWord(kanji) {
    if (!confirm(`${this.toKatakana('「')}${kanji}${this.toKatakana('」ヲジショカラサクジョシマスカ？')}`)) {
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'REMOVE_FROM_DICTIONARY',
        kanji: kanji
      });

      if (response && response.success) {
        // データを再読み込みして表示を更新
        await this.loadInitialData();
      } else {
        alert(this.toKatakana('タンゴノサクジョニシッパイシマシタ。'));
      }
    } catch (e) {
      console.error('Error deleting word:', e);
      alert(this.toKatakana('サクジョチュウニエラーガハッセイシマシタ:') + e.message);
    }
  }

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}

document.addEventListener('DOMContentLoaded', () => new DictionaryPanel());