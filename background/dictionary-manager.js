class DictionaryManager {
  constructor() {
    this.STORAGE_KEY = 'wingdings_dictionary';
    this.MAX_ENTRIES = 5000;
    this.MAX_STORAGE_SIZE = 95 * 1024; // 95KB (100KB制限の95%)
    this.cache = new Map();
  }

  async init() {
    console.log('DictionaryManager: Initializing...');
    try {
      const data = await chrome.storage.sync.get(this.STORAGE_KEY);
      console.log('DictionaryManager: Loaded data from storage:', data);
      this.dictionary = data[this.STORAGE_KEY] || {
        words: {},
        settings: {
          autoConvert: false,
          showUnknownWords: true,
          romajiStyle: 'hepburn'
        },
        metadata: {
          version: '1.0',
          lastUpdate: Date.now(),
          entryCount: 0
        }
      };
      
      this.buildCache();
      console.log('DictionaryManager: Initialized with', this.dictionary.metadata.entryCount, 'words.');
    } catch (e) {
      console.error('DictionaryManager: Error during init:', e);
    }
  }

  buildCache() {
    this.cache.clear();
    Object.entries(this.dictionary.words).forEach(([word, data]) => {
      this.cache.set(word, data);
    });
    console.log('DictionaryManager: Cache built with', this.cache.size, 'words.');
  }

  async addWord(kanji, reading, romaji = null) {
    // ... (rest of the method is unchanged)
    if (Object.keys(this.dictionary.words).length >= this.MAX_ENTRIES) {
      throw new Error(`Dictionary limit reached: ${this.MAX_ENTRIES} words`);
    }

    if (!romaji) {
      romaji = this.computeRomaji(reading);
    }

    const wordData = {
      reading: reading,
      romaji: romaji,
      frequency: 1,
      lastUsed: Date.now(),
      dateAdded: Date.now()
    };

    if (this.dictionary.words[kanji]) {
      this.dictionary.words[kanji].frequency++;
      this.dictionary.words[kanji].lastUsed = Date.now();
    } else {
      this.dictionary.words[kanji] = wordData;
      this.dictionary.metadata.entryCount++;
    }

    this.dictionary.metadata.lastUpdate = Date.now();
    this.cache.set(kanji, wordData);

    await this.save();
    console.log('DictionaryManager: Added/Updated word:', kanji);
    return wordData;
  }

  computeRomaji(reading) {
    const katakanaText = reading.replace(/[ぁ-ゔ]/g, s => String.fromCharCode(s.charCodeAt(0) + 0x60));
    const kanaMap = {
      'キャ': 'KYA', 'キュ': 'KYU', 'キョ': 'KYO',
      'シャ': 'SHA', 'シュ': 'SHU', 'ショ': 'SHO', 'シェ': 'SHE',
      'チャ': 'CHA', 'チュ': 'CHU', 'チョ': 'CHO', 'チェ': 'CHE',
      'ニャ': 'NYA', 'ニュ': 'NYU', 'ニョ': 'NYO',
      'ヒャ': 'HYA', 'ヒュ': 'HYU', 'ヒョ': 'HYO',
      'ミャ': 'MYA', 'ミュ': 'MYU', 'ミョ': 'MYO',
      'リャ': 'RYA', 'リュ': 'RYU', 'リョ': 'RYO',
      'ギャ': 'GYA', 'ギュ': 'GYU', 'ギョ': 'GYA',
      'ジャ': 'JA', 'ジュ': 'JU', 'ジョ': 'JO', 'ジェ': 'JE',
      'ビャ': 'BYA', 'ビュ': 'BYU', 'ビョ': 'BYO',
      'ピャ': 'PYA', 'ピュ': 'PYU', 'ピョ': 'PYO',
      'ティ': 'TI', 'トゥ': 'TU',
      'ディ': 'DI', 'ドゥ': 'DU',
      'ファ': 'FA', 'フィ': 'FI', 'フェ': 'FE', 'フォ': 'FO',
      'ウィ': 'WI', 'ウェ': 'WE', 'ウォ': 'WO',
      'ヴァ': 'VA', 'ヴィ': 'VI', 'ヴ': 'VU', 'ヴェ': 'VE', 'ヴォ': 'VO',
      'ア': 'A', 'イ': 'I', 'ウ': 'U', 'エ': 'E', 'オ': 'O',
      'カ': 'KA', 'キ': 'KI', 'ク': 'KU', 'ケ': 'KE', 'コ': 'KO',
      'ガ': 'GA', 'ギ': 'GI', 'グ': 'GU', 'ゲ': 'GE', 'ゴ': 'GO',
      'サ': 'SA', 'シ': 'SHI', 'ス': 'SU', 'セ': 'SE', 'ソ': 'SO',
      'ザ': 'ZA', 'ジ': 'JI', 'ズ': 'ZU', 'ゼ': 'ZE', 'ゾ': 'ZO',
      'タ': 'TA', 'チ': 'CHI', 'ツ': 'TSU', 'テ': 'TE', 'ト': 'TO',
      'ダ': 'DA', 'ヂ': 'DI', 'ヅ': 'DU', 'デ': 'DE', 'ド': 'DO',
      'ナ': 'NA', 'ニ': 'NI', 'ヌ': 'NU', 'ネ': 'NE', 'ノ': 'NO',
      'ハ': 'HA', 'ヒ': 'HI', 'フ': 'FU', 'ヘ': 'HE', 'ホ': 'HO',
      'バ': 'BA', 'ビ': 'BI', 'ブ': 'BU', 'ベ': 'BE', 'ボ': 'BO',
      'パ': 'PA', 'ピ': 'PI', 'プ': 'PU', 'ペ': 'PE', 'ポ': 'PO',
      'マ': 'MA', 'ミ': 'MI', 'ム': 'MU', 'メ': 'ME', 'モ': 'MO',
      'ヤ': 'YA', 'ユ': 'YU', 'ヨ': 'YO',
      'ラ': 'RA', 'リ': 'RI', 'ル': 'RU', 'レ': 'RE', 'ロ': 'RO',
      'ワ': 'WA', 'ヰ': 'I', 'ヱ': 'E', 'ヲ': 'O', 'ン': 'N',
      'ァ': 'A', 'ィ': 'I', 'ゥ': 'U', 'ェ': 'E', 'ォ': 'O',
      'ッ': '', 'ー': '-'
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

  async removeWord(kanji) {
    if (this.dictionary.words[kanji]) {
      delete this.dictionary.words[kanji];
      this.cache.delete(kanji);
      this.dictionary.metadata.entryCount--;
      this.dictionary.metadata.lastUpdate = Date.now();
      await this.save();
      console.log('DictionaryManager: Removed word:', kanji);
      return true;
    }
    console.log('DictionaryManager: Word not found for removal:', kanji);
    return false;
  }

  getWord(kanji) {
    return this.cache.get(kanji) || null;
  }

  async searchWords(query, limit = 50) {
    console.log('DictionaryManager: Searching for query:', query);
    const results = [];
    const queryLower = query.toLowerCase();

    for (const [kanji, data] of this.cache.entries()) {
      if (results.length >= limit) break;
      
      if (kanji.includes(query) || 
          data.reading.includes(query) || 
          data.romaji.toLowerCase().includes(queryLower)) {
        results.push({
          kanji: kanji,
          ...data,
          relevance: this.calculateRelevance(query, kanji, data)
        });
      }
    }

    results.sort((a, b) => b.relevance - a.relevance);
    console.log('DictionaryManager: Search results count:', results.length);
    return results;
  }

  calculateRelevance(query, kanji, data) {
    let score = 0;
    if (kanji === query) score += 100;
    if (data.reading === query) score += 90;
    if (data.romaji === query.toLowerCase()) score += 80;
    if (kanji.startsWith(query)) score += 50;
    if (data.reading.startsWith(query)) score += 40;
    if (data.romaji.startsWith(query.toLowerCase())) score += 30;
    score += Math.min(data.frequency, 50);
    const daysSinceUse = (Date.now() - data.lastUsed) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 30 - daysSinceUse);
    return score;
  }

  async save() {
    const serialized = JSON.stringify(this.dictionary);
    const size = new Blob([serialized]).size;
    
    if (size > this.MAX_STORAGE_SIZE) {
      await this.cleanup();
    }

    console.log('DictionaryManager: Saving to storage:', this.dictionary);
    await chrome.storage.sync.set({
      [this.STORAGE_KEY]: this.dictionary
    });

    console.log(`DictionaryManager: Saved ${this.dictionary.metadata.entryCount} words, ${size} bytes`);
  }

  async cleanup() {
    const words = Object.entries(this.dictionary.words);
    
    const scored = words.map(([kanji, data]) => ({
      kanji,
      data,
      score: data.frequency + Math.max(0, 30 - (Date.now() - data.lastUsed) / (1000 * 60 * 60 * 24))
    }));

    scored.sort((a, b) => a.score - b.score);
    const toDelete = scored.slice(0, Math.floor(scored.length * 0.25));

    toDelete.forEach(item => {
      delete this.dictionary.words[item.kanji];
      this.cache.delete(item.kanji);
    });

    this.dictionary.metadata.entryCount = Object.keys(this.dictionary.words).length;
    console.log(`DictionaryManager: Cleaned up ${toDelete.length} words from dictionary`);
  }

  getStatistics() {
    const words = Object.values(this.dictionary.words);
    const now = Date.now();
    
    return {
      totalWords: words.length,
      averageFrequency: words.reduce((sum, w) => sum + w.frequency, 0) / (words.length || 1),
      mostUsedWord: words.length > 0 ? words.reduce((max, w) => w.frequency > max.frequency ? w : max, words[0]) : null,
      recentlyAdded: words.filter(w => now - w.dateAdded < 7 * 24 * 60 * 60 * 1000).length,
      storageUsage: Math.round((new Blob([JSON.stringify(this.dictionary)]).size / this.MAX_STORAGE_SIZE) * 100),
      lastUpdate: new Date(this.dictionary.metadata.lastUpdate).toLocaleString()
    };
  }
}

module.exports = { DictionaryManager };
