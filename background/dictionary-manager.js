class DictionaryManager {
  constructor() {
    this.STORAGE_KEY = 'wingdings_dictionary';
    this.MAX_ENTRIES = 5000;
    this.MAX_STORAGE_SIZE = 95 * 1024; // 95KB (100KB制限の95%)
    this.cache = new Map();
  }

  async init() {
    const data = await chrome.storage.sync.get(this.STORAGE_KEY);
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
  }

  buildCache() {
    this.cache.clear();
    Object.entries(this.dictionary.words).forEach(([word, data]) => {
      this.cache.set(word, data);
    });
  }

  async addWord(kanji, reading, romaji = null) {
    // 容量チェック
    if (Object.keys(this.dictionary.words).length >= this.MAX_ENTRIES) {
      throw new Error(`Dictionary limit reached: ${this.MAX_ENTRIES} words`);
    }

    if (!romaji) {
      // Romaji must be provided by the caller.
      throw new Error('Romaji is required to add a word.');
    }

    const wordData = {
      reading: reading,
      romaji: romaji,
      frequency: 1,
      lastUsed: Date.now(),
      dateAdded: Date.now()
    };

    // 既存の単語は頻度更新
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
    return wordData;
  }

  async removeWord(kanji) {
    if (this.dictionary.words[kanji]) {
      delete this.dictionary.words[kanji];
      this.cache.delete(kanji);
      this.dictionary.metadata.entryCount--;
      this.dictionary.metadata.lastUpdate = Date.now();
      await this.save();
      return true;
    }
    return false;
  }

  getWord(kanji) {
    return this.cache.get(kanji) || null;
  }

  async searchWords(query, limit = 50) {
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

    // 関連度でソート
    results.sort((a, b) => b.relevance - a.relevance);
    return results;
  }

  calculateRelevance(query, kanji, data) {
    let score = 0;
    
    // 完全一致
    if (kanji === query) score += 100;
    if (data.reading === query) score += 90;
    if (data.romaji === query.toLowerCase()) score += 80;
    
    // 前方一致
    if (kanji.startsWith(query)) score += 50;
    if (data.reading.startsWith(query)) score += 40;
    if (data.romaji.startsWith(query.toLowerCase())) score += 30;
    
    // 使用頻度
    score += Math.min(data.frequency, 50);
    
    // 最近使用
    const daysSinceUse = (Date.now() - data.lastUsed) / (1000 * 60 * 60 * 24);
    score += Math.max(0, 30 - daysSinceUse);
    
    return score;
  }

  async save() {
    const serialized = JSON.stringify(this.dictionary);
    const size = new Blob([serialized]).size;
    
    if (size > this.MAX_STORAGE_SIZE) {
      // 自動クリーンアップ：古い&低頻度の単語を削除
      await this.cleanup();
    }

    await chrome.storage.sync.set({
      [this.STORAGE_KEY]: this.dictionary
    });

    console.log(`Dictionary saved: ${this.dictionary.metadata.entryCount} words, ${size} bytes`);
  }

  async cleanup() {
    const words = Object.entries(this.dictionary.words);
    
    // スコア計算（頻度 + 最近使用）
    const scored = words.map(([kanji, data]) => ({
      kanji,
      data,
      score: data.frequency + Math.max(0, 30 - (Date.now() - data.lastUsed) / (1000 * 60 * 60 * 24))
    }));

    // スコアでソートし、下位25%を削除
    scored.sort((a, b) => a.score - b.score);
    const toDelete = scored.slice(0, Math.floor(scored.length * 0.25));

    toDelete.forEach(item => {
      delete this.dictionary.words[item.kanji];
      this.cache.delete(item.kanji);
    });

    this.dictionary.metadata.entryCount = Object.keys(this.dictionary.words).length;
    console.log(`Cleaned up ${toDelete.length} words from dictionary`);
  }

  async exportDictionary() {
    const exportData = {
      ...this.dictionary,
      exportDate: Date.now(),
      version: chrome.runtime.getManifest().version
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    return blob;
  }

  async importDictionary(jsonData) {
    try {
      const importedData = JSON.parse(jsonData);
      
      // バリデーション
      if (!importedData.words || typeof importedData.words !== 'object') {
        throw new Error('Invalid dictionary format');
      }

      // マージまたは置換
      const choice = await this.showImportDialog(Object.keys(importedData.words).length);
      
      if (choice === 'replace') {
        this.dictionary.words = importedData.words;
      } else if (choice === 'merge') {
        Object.assign(this.dictionary.words, importedData.words);
      }

      this.dictionary.metadata.entryCount = Object.keys(this.dictionary.words).length;
      this.dictionary.metadata.lastUpdate = Date.now();
      
      this.buildCache();
      await this.save();
      
      return {
        success: true,
        imported: Object.keys(importedData.words).length,
        total: this.dictionary.metadata.entryCount
      };
    } catch (error) {
      console.error('Import failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  getStatistics() {
    const words = Object.values(this.dictionary.words);
    const now = Date.now();
    
    return {
      totalWords: words.length,
      averageFrequency: words.reduce((sum, w) => sum + w.frequency, 0) / words.length,
      mostUsedWord: words.reduce((max, w) => w.frequency > max.frequency ? w : max, words[0]),
      recentlyAdded: words.filter(w => now - w.dateAdded < 7 * 24 * 60 * 60 * 1000).length,
      storageUsage: Math.round((new Blob([JSON.stringify(this.dictionary)]).size / this.MAX_STORAGE_SIZE) * 100),
      lastUpdate: new Date(this.dictionary.metadata.lastUpdate).toLocaleString()
    };
  }
}

module.exports = { DictionaryManager };