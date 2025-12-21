/**
 * @jest-environment jsdom
 */

const { DictionaryManager } = require('../background/dictionary-manager.js');

// Mock chrome.storage API
global.chrome = {
  storage: {
    sync: {
      data: {},
      get: jest.fn((key) => Promise.resolve(global.chrome.storage.sync.data)),
      set: jest.fn((data) => {
        Object.assign(global.chrome.storage.sync.data, data);
        return Promise.resolve();
      })
    }
  }
};

describe('DictionaryManager Unicode Support', () => {
  let dm;

  beforeEach(async () => {
    global.chrome.storage.sync.data = {};
    dm = new DictionaryManager();
    await dm.init();
  });

  describe('Special Unicode Characters (Supplementary Plane)', () => {
    test('should add and retrieve word with rare CJK characters (𰻞𰻞麺)', async () => {
      const kanji = '𰻞𰻞麺';
      const reading = 'めんめんめん';
      
      await dm.addWord(kanji, reading);
      
      const result = dm.getWord(kanji);
      expect(result).not.toBeNull();
      expect(result.reading).toBe(reading);
      expect(result.romaji).toBe('MENMENMEN');
    });

    test('should search for word with exact match (𰻞𰻞麺)', async () => {
      const kanji = '𰻞𰻞麺';
      const reading = 'めんめんめん';
      
      await dm.addWord(kanji, reading);
      
      const results = await dm.searchWords(kanji);
      expect(results.length).toBe(1);
      expect(results[0].kanji).toBe(kanji);
      expect(results[0].reading).toBe(reading);
    });

    test('should search for word with partial match (𰻞)', async () => {
      const kanji = '𰻞𰻞麺';
      const reading = 'めんめんめん';
      
      await dm.addWord(kanji, reading);
      
      const results = await dm.searchWords('𰻞');
      expect(results.length).toBe(1);
      expect(results[0].kanji).toBe(kanji);
    });

    test('should search by reading with hiragana (めん)', async () => {
      const kanji = '𰻞𰻞麺';
      const reading = 'めんめんめん';
      
      await dm.addWord(kanji, reading);
      
      const results = await dm.searchWords('めん');
      expect(results.length).toBe(1);
      expect(results[0].kanji).toBe(kanji);
    });

    test('should search by romaji (men)', async () => {
      const kanji = '𰻞𰻞麺';
      const reading = 'めんめんめん';
      
      await dm.addWord(kanji, reading);
      
      const results = await dm.searchWords('men');
      expect(results.length).toBe(1);
      expect(results[0].kanji).toBe(kanji);
    });
  });

  describe('Mixed Content with Special Characters', () => {
    test('should handle word containing both common and rare characters', async () => {
      // 麺 (U+9EBA) is a common kanji, 𰻞 (U+30EDE) is a rare character
      const kanji = '𰻞麺𰻞';
      const reading = 'めんめんめん';
      
      await dm.addWord(kanji, reading);
      
      const result = dm.getWord(kanji);
      expect(result).not.toBeNull();
      expect(result.reading).toBe(reading);
    });

    test('should correctly compute romaji for rare characters in reading', async () => {
      const kanji = '𰻞𰻞麺';
      const reading = 'めんめんめん';
      
      const romaji = dm.computeRomaji(reading);
      expect(romaji).toBe('MENMENMEN');
    });
  });

  describe('Multiple Words with Special Characters', () => {
    test('should handle multiple words with special characters', async () => {
      const words = [
        { kanji: '𰻞𰻞麺', reading: 'めんめんめん' },
        { kanji: '辞書機能', reading: 'じしょきのう' },
        { kanji: '𰻞辞書', reading: 'めんじしょ' }
      ];
      
      for (const word of words) {
        await dm.addWord(word.kanji, word.reading);
      }
      
      // Search for each word
      for (const word of words) {
        const results = await dm.searchWords(word.kanji);
        expect(results.length).toBeGreaterThan(0);
        const found = results.find(r => r.kanji === word.kanji);
        expect(found).toBeDefined();
        expect(found.reading).toBe(word.reading);
      }
    });

    test('should search across multiple words with special characters', async () => {
      await dm.addWord('𰻞𰻞麺', 'めんめんめん');
      await dm.addWord('𰻞辞書', 'めんじしょ');
      await dm.addWord('辞書機能', 'じしょきのう');
      
      const results = await dm.searchWords('𰻞');
      expect(results.length).toBe(2);
      const kanjis = results.map(r => r.kanji).sort();
      expect(kanjis).toContain('𰻞𰻞麺');
      expect(kanjis).toContain('𰻞辞書');
    });
  });

  describe('Storage Persistence with Special Characters', () => {
    test('should persist and reload words with special characters', async () => {
      const kanji = '𰻞𰻞麺';
      const reading = 'めんめんめん';
      
      await dm.addWord(kanji, reading);
      
      // Create new instance to simulate reload
      const dm2 = new DictionaryManager();
      await dm2.init();
      
      const result = dm2.getWord(kanji);
      expect(result).not.toBeNull();
      expect(result.reading).toBe(reading);
      expect(result.romaji).toBe('MENMENMEN');
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty search query', async () => {
      await dm.addWord('𰻞𰻞麺', 'めんめんめん');
      
      const results = await dm.searchWords('');
      // Empty query should return all words (up to limit)
      expect(results.length).toBe(1);
    });

    test('should handle search with no matches', async () => {
      await dm.addWord('𰻞𰻞麺', 'めんめんめん');
      
      const results = await dm.searchWords('存在しない');
      expect(results.length).toBe(0);
    });

    test('should remove word with special characters', async () => {
      const kanji = '𰻞𰻞麺';
      await dm.addWord(kanji, 'めんめんめん');
      
      const removed = await dm.removeWord(kanji);
      expect(removed).toBe(true);
      
      const result = dm.getWord(kanji);
      expect(result).toBeNull();
    });
  });

  describe('Japanese Problem Statement Test', () => {
    test('辞書機能が機能するかを𰻞𰻞麺という通常変換できない文字を使って試す', async () => {
      // Test the exact scenario from the problem statement
      const testWord = '𰻞𰻞麺';
      const testReading = 'めんめんめん';
      
      // Add the word
      await dm.addWord(testWord, testReading);
      
      // Verify it can be retrieved
      const retrieved = dm.getWord(testWord);
      expect(retrieved).not.toBeNull();
      expect(retrieved.reading).toBe(testReading);
      
      // Verify it can be searched
      const searchResults = await dm.searchWords(testWord);
      expect(searchResults.length).toBeGreaterThan(0);
      expect(searchResults[0].kanji).toBe(testWord);
      
      // Verify partial search works
      const partialResults = await dm.searchWords('𰻞');
      expect(partialResults.length).toBeGreaterThan(0);
      
      // Verify reading search works
      const readingResults = await dm.searchWords('めん');
      expect(readingResults.length).toBeGreaterThan(0);
      
      console.log('✓ Dictionary function successfully handles rare Unicode characters like 𰻞𰻞麺');
      console.log('✓ All search methods (exact, partial, reading) work correctly');
    });
  });
});
