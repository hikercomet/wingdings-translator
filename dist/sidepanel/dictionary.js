class DictionaryPanel {
  constructor() {
    this.wordListEl = document.getElementById('wordList');
    this.searchInputEl = document.getElementById('searchInput');
    this.addWordBtnEl = document.getElementById('addWordBtn');
    this.newWordKanjiEl = document.getElementById('newWordKanji');
    this.newWordReadingEl = document.getElementById('newWordReading');
    this.wordCountEl = document.getElementById('wordCount');

    this.words = []; // Store words as an array
    this.filter = '';

    this.init();
  }

  async init() {
    this.bindEvents();
    await this.loadDictionary();
  }

  bindEvents() {
    this.searchInputEl.addEventListener('input', (e) => {
      this.filter = e.target.value.toLowerCase();
      this.renderWordList();
    });

    this.addWordBtnEl.addEventListener('click', () => this.addWord());
  }

  async loadDictionary() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'SEARCH_DICTIONARY', query: '', limit: 5000 });
      if (response && response.success) {
        this.words = response.results.sort((a, b) => a.kanji.localeCompare(b.kanji, 'ja'));
        this.renderWordList();
      } else {
        console.error('Failed to load dictionary:', response?.error);
        this.wordListEl.innerHTML = '<div class="word-item">辞書の読み込みに失敗しました。</div>';
      }
    } catch (e) {
      console.error('Error loading dictionary:', e);
      this.wordListEl.innerHTML = '<div class="word-item">辞書の読み込み中にエラーが発生しました。</div>';
    }
  }

  renderWordList() {
    this.wordListEl.innerHTML = '';
    
    const filteredWords = this.words.filter(word => 
        word.kanji.toLowerCase().includes(this.filter) || 
        word.reading.toLowerCase().includes(this.filter) ||
        word.romaji.toLowerCase().includes(this.filter)
    );

    if (filteredWords.length === 0) {
        this.wordListEl.innerHTML = '<div class="word-item">該当する単語はありません。</div>';
    }

    for (const word of filteredWords) {
        const itemEl = document.createElement('div');
        itemEl.className = 'word-item';
        itemEl.innerHTML = `
            <div class="word-display">
                <span class="word-kanji">${word.kanji}</span>
                <span class="word-reading">${word.reading} (${word.romaji})</span>
            </div>
            <button class="delete-btn" data-kanji="${word.kanji}">削除</button>
        `;
        this.wordListEl.appendChild(itemEl);
    }

    this.wordCountEl.textContent = this.words.length;

    this.wordListEl.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => this.deleteWord(e.target.dataset.kanji));
    });
  }

  async addWord() {
    const kanji = this.newWordKanjiEl.value.trim();
    const reading = this.newWordReadingEl.value.trim();

    if (!kanji || !reading) {
        alert('単語とよみを両方入力してください。');
        return;
    }

    try {
        const response = await chrome.runtime.sendMessage({
            type: 'ADD_TO_DICTIONARY',
            kanji: kanji,
            reading: reading
        });

        if (response && response.success) {
            // Reload the whole dictionary to get the new word and proper sort order
            await this.loadDictionary();
            this.newWordKanjiEl.value = '';
            this.newWordReadingEl.value = '';
        } else {
            alert('単語の追加に失敗しました: ' + response?.error);
        }
    } catch (e) {
        console.error('Error adding word:', e);
        alert('単語の追加中にエラーが発生しました。');
    }
  }

  async deleteWord(kanji) {
    if (!confirm(`「${kanji}」を辞書から削除しますか？`)) {
        return;
    }

    try {
        const response = await chrome.runtime.sendMessage({
            type: 'REMOVE_FROM_DICTIONARY',
            kanji: kanji
        });

        if (response && response.success) {
            // Reload to reflect the change
            await this.loadDictionary();
        } else {
            alert('単語の削除に失敗しました: ' + response?.error);
        }
    } catch (e) {
        console.error('Error deleting word:', e);
        alert('単語の削除中にエラーが発生しました。');
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new DictionaryPanel();
});