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
    let searchTimeout;
    this.searchInputEl.addEventListener('input', (e) => {
      this.filter = e.target.value.toLowerCase().trim();
      this.renderWordList();
    });
    this.searchInputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        e.target.value = '';
        this.filter = '';
        this.renderWordList();
        e.target.blur();
      }
    });

    this.addWordBtnEl.addEventListener('click', () => this.addWord());
    this.wordListEl.addEventListener('click', (e) => {
      if (e.target.classList.contains('delete-btn')) {
        setTimeout(() => this.loadDictionary(), 100);
      }
    });
  }

  async loadDictionary() {
    try {
      const data = await chrome.storage.sync.get('wingdings_dictionary');
      const dictionary = data.wingdings_dictionary || { words: {} };
      this.words = Object.entries(dictionary.words).map(([kanji, data]) => ({
        kanji,
        reading: data.reading,
        romaji: data.romaji
      })).sort((a, b) => a.kanji.localeCompare(b.kanji, 'ja'));
      this.renderWordList();
      this.wordCountEl.textContent = this.words.length;
    } catch (e) {
      console.error('Error loading dictionary:', e);
      this.wordListEl.innerHTML = '<div class="word-item">辞書の読み込み中にエラーが発生しました。</div>';
    }
  }

  renderWordList() {
    this.wordListEl.innerHTML = '';

    const filteredWords = this.words.filter(word => {
      const kanjiLower = word.kanji.toLowerCase();
      const readingLower = word.reading.toLowerCase();
      const romajiLower = (word.romaji || '').toLowerCase();
      return kanjiLower.includes(this.filter) || readingLower.includes(this.filter) || romajiLower.includes(this.filter);
    }).sort((a, b) => {
      const aScore = this.getSearchScore(a);
      const bScore = this.getSearchScore(b);
      if (aScore !== bScore) return bScore - aScore;
      return a.kanji.localeCompare(b.kanji, 'ja');
    });

    if (filteredWords.length === 0) {
        this.wordListEl.innerHTML = '<div class="word-item empty-state">該当する単語はありません。<br><small>ヒント: 単語、よみ、ローマ字で検索できます</small></div>';
    } else {
        filteredWords.forEach(word => {
            const itemEl = document.createElement('div');
            itemEl.className = 'word-item';
            itemEl.innerHTML = `
                <div class="word-display">
                    <span class="word-kanji">${word.kanji}</span>
                    <span class="word-reading">${word.reading} (${word.romaji || ''})</span>
                </div>
                <button class="delete-btn" data-kanji="${word.kanji}">削除</button>
            `;
            this.wordListEl.appendChild(itemEl);
        });
        this.wordListEl.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.deleteWord(e.target.dataset.kanji));
        });
    }

    const count = filteredWords.length;
    this.wordCountEl.textContent = `${count} / ${this.words.length} 語`;
  }

  getSearchScore(word) {
    const score = 0;
    if (word.kanji.toLowerCase().includes(this.filter)) score += 3;
    if (word.reading.toLowerCase().includes(this.filter)) score += 2;
    if ((word.romaji || '').toLowerCase().includes(this.filter)) score += 1;
    return score;
  }

  async addWord() {
    const kanji = this.newWordKanjiEl.value.trim();
    const reading = this.newWordReadingEl.value.trim();

    if (!kanji || !reading) {
        alert('単語とよみを両方入力してください。');
        return;
    }

    try {
        const romaji = this.convertToRomaji(reading);
        const response = await chrome.runtime.sendMessage({
            type: 'ADD_TO_DICTIONARY',
            kanji: kanji,
            reading: reading,
            romaji: romaji
        });

        if (response && response.success) {
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

  convertToRomaji(reading) {
    const katakanaText = reading.replace(/[ぁ-ゔ]/g, s => String.fromCharCode(s.charCodeAt(0) + 0x60));
    const kanaMap = {
      'キャ': 'KYA', 'キュ': 'KYU', 'キョ': 'KYO',
      'シャ': 'SHA', 'シュ': 'SHU', 'ショ': 'SHO', 'シェ': 'SHE',
      'チャ': 'CHA', 'チュ': 'CHU', 'チョ': 'CHO', 'チェ': 'CHE',
      'ニャ': 'NYA', 'ニュ': 'NYU', 'ニョ': 'NYO',
      'ヒャ': 'HYA', 'ヒュ': 'HYU', 'ヒョ': 'HYO',
      'ミャ': 'MYA', 'ミュ': 'MYU', 'ミョ': 'MYO',
      'リャ': 'RYA', 'リュ': 'RYU', 'リョ': 'RYO',
      'ギャ': 'GYA', 'ギュ': 'GYU', 'ギョ': 'GYO',
      'ジャ': 'JA', 'ジュ': 'JU', 'ジョ': 'JO', 'ジェ': 'JE',
      'ビャ': 'BYA', 'ビュ': 'BYU', 'ビョ': 'BYO',
      'ピャ': 'PYA', 'ピュ': 'PYU', 'ピョ': 'PYO',
      'ア': 'A', 'イ': 'I', 'ウ': 'U', 'エ': 'E', 'オ': 'O',
      'カ': 'KA', 'キ': 'KI', 'ク': 'KU', 'ケ': 'KE', 'コ': 'KO',
      'ガ': 'GA', 'ギ': 'GI', 'グ': 'GU', 'ゲ': 'GE', 'ゴ': 'GO',
      'サ': 'SA', 'シ': 'SHI', 'ス': 'SU', 'セ': 'SE', 'ソ': 'SO',
      'ザ': 'ZA', 'ジ': 'JI', 'ズ': 'ZU', 'ゼ': 'ZE', 'ゾ': 'ZO',
      'タ': 'TA', 'チ': 'CHI', 'ツ': 'TSU', 'テ': 'TE', 'ト': 'TO',
      'ダ': 'DA', 'デ': 'DE', 'ド': 'DO',
      'ナ': 'NA', 'ニ': 'NI', 'ヌ': 'NU', 'ネ': 'NE', 'ノ': 'NO',
      'ハ': 'HA', 'ヒ': 'HI', 'フ': 'FU', 'ヘ': 'HE', 'ホ': 'HO',
      'バ': 'BA', 'ビ': 'BI', 'ブ': 'BU', 'ベ': 'BE', 'ボ': 'BO',
      'パ': 'PA', 'ピ': 'PI', 'プ': 'PU', 'ペ': 'PE', 'ポ': 'PO',
      'マ': 'MA', 'ミ': 'MI', 'ム': 'MU', 'メ': 'ME', 'モ': 'MO',
      'ヤ': 'YA', 'ユ': 'YU', 'ヨ': 'YO',
      'ラ': 'RA', 'リ': 'RI', 'ル': 'RU', 'レ': 'RE', 'ロ': 'RO',
      'ワ': 'WA', 'ン': 'N', 'ッ': '', 'ー': '-'
    };
    let result = '';
    let textToProcess = katakanaText;
    for (let i = 0; i < textToProcess.length; i++) {
      let twoChar = textToProcess.substring(i, i + 2);
      if (kanaMap[twoChar]) {
        result += kanaMap[twoChar];
        i++;
        continue;
      }
      let oneChar = textToProcess[i];
      if (oneChar === 'ッ') {
        let nextChar = textToProcess[i + 1];
        if (nextChar && kanaMap[nextChar]) {
          let firstRomajiChar = kanaMap[nextChar][0];
          if (firstRomajiChar !== 'N') {
            result += firstRomajiChar;
          }
        }
        continue;
      }
      result += kanaMap[oneChar] || oneChar;
    }
    result = result.replace(/([AEIOU])-/g, '$1$1');
    return result.toUpperCase();
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