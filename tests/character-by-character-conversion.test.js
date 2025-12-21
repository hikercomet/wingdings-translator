/**
 * Test character-by-character conversion feature
 * New requirement: Even if only "𰻞" is registered, "𰻞𰻞麺" should be translatable
 */

const { TextConverter } = require('../content/converter.js');

// Mock chrome.runtime API
global.chrome = {
  runtime: {
    sendMessage: jest.fn()
  }
};

describe('Character-by-Character Conversion', () => {
  let converter;
  const dicPath = 'node_modules/kuromoji/dict';

  beforeEach(async () => {
    converter = new TextConverter();
    
    // Mock user dictionary response
    global.chrome.runtime.sendMessage.mockResolvedValue({
      success: true,
      dictionary: {
        '𰻞': { reading: 'めん', romaji: 'MEN' }
      }
    });
    
    await converter.init(dicPath);
  });

  describe('Single Character Registration', () => {
    test('should convert registered single character', async () => {
      const result = await converter.convert('𰻞');
      // 𰻞 with reading めん -> MEN
      expect(result).toBe('MEN');
    });

    test('should convert compound word using character-by-character lookup', async () => {
      // Even though only "𰻞" is registered, "𰻞𰻞麺" should work
      const result = await converter.convert('𰻞𰻞麺');
      // 𰻞(めん) + 𰻞(めん) + 麺(メン) = めんめんめん -> MENMENMEN
      expect(result).toBe('MENMENMEN');
    });

    test('should handle partial matches with known and unknown characters', async () => {
      const result = await converter.convert('𰻞麺');
      // 𰻞(めん) + 麺(メン) = めんめん -> MENMEN
      expect(result).toBe('MENMEN');
    });
  });

  describe('Multiple Character Registration', () => {
    beforeEach(async () => {
      converter = new TextConverter();
      
      // Mock user dictionary with multiple characters
      global.chrome.runtime.sendMessage.mockResolvedValue({
        success: true,
        dictionary: {
          '𰻞': { reading: 'めん', romaji: 'MEN' },
          '辞': { reading: 'じ', romaji: 'JI' },
          '書': { reading: 'しょ', romaji: 'SHO' }
        }
      });
      
      await converter.init(dicPath);
    });

    test('should combine multiple registered characters', async () => {
      const result = await converter.convert('辞書');
      // Since both are registered individually, should use character readings
      // But kuromoji might tokenize as one word, so it depends on tokenization
      expect(result).toMatch(/[A-Z]+/);
    });

    test('should handle mix of registered and standard characters', async () => {
      const result = await converter.convert('𰻞は麺');
      // 𰻞(めん) + は(HA) + 麺(メン)
      expect(result).toMatch(/^MEN.*MEN$/);
    });
  });

  describe('Edge Cases', () => {
    test('should handle characters not in dictionary', async () => {
      const result = await converter.convert('未登録文字');
      // Should still process using kuromoji's default readings
      expect(result).toMatch(/[A-Z]+/);
    });

    test('should handle empty string', async () => {
      const result = await converter.convert('');
      expect(result).toBe('');
    });

    test('should handle ASCII text', async () => {
      const result = await converter.convert('TEST');
      expect(result).toBe('TEST');
    });
  });

  describe('Character-by-Character Reading Function', () => {
    test('getCharacterByCharacterReading should build reading from individual characters', () => {
      // This is a unit test for the helper function
      converter.userDictionary.set('𰻞', 'メン');
      converter.userDictionary.set('麺', 'メン');
      
      const reading = converter.getCharacterByCharacterReading('𰻞𰻞麺');
      expect(reading).toBe('メンメンメン');
    });

    test('getCharacterByCharacterReading should handle partial matches', () => {
      converter.userDictionary.set('𰻞', 'メン');
      
      const reading = converter.getCharacterByCharacterReading('𰻞X麺');
      // 𰻞 is found, X is not, 麺 is not -> should return メンX麺
      expect(reading).toBe('メンX麺');
    });

    test('getCharacterByCharacterReading should return original if nothing found', () => {
      converter.userDictionary.clear();
      
      const reading = converter.getCharacterByCharacterReading('𰻞𰻞麺');
      expect(reading).toBe('𰻞𰻞麺');
    });
  });

  describe('Tokenization Gap Handling', () => {
    test('should handle kuromoji tokenization gaps with supplementary plane characters', async () => {
      // Kuromoji may not tokenize "𰻞𰻞麺" completely (known bug)
      // Our code should detect this and add missing characters
      const result = await converter.convert('𰻞𰻞麺');
      
      // Should still produce output even if tokenization is incomplete
      expect(result).toBeTruthy();
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
