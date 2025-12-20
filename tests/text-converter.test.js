/**
 * @jest-environment node
 */
const { TextConverter } = require('../content/converter.js');

jest.mock('kuromoji', () => ({
  builder: jest.fn(() => ({
    build: jest.fn((callback) => {
      const mockTokenizer = {
        tokenize: (text) => {
          if (text.includes('こんにちは')) {
            return [{ surface_form: 'こんにちは', reading: 'コンニチハ' }];
          }
          return [{ surface_form: text, reading: text }];
        }
      };
      callback(null, mockTokenizer);
    })
  }))
}));

describe('TextConverter', () => {
  let converter;

  beforeEach(async () => {
    converter = new TextConverter();
    // Mock the maps directly for isolated unit testing
    converter.wingdingsMap = { 'A': '\uF041', 'B': '\uF042', '1': '\uF031' };
    converter.emojiMap = { 'A': '✌️' };
    await converter.init('dummy/path');
  });

  test('should convert English to Wingdings', () => {
    const result = converter.convertTextToWingdings('AB');
    expect(result).toBe('\uF041\uF042');
  });

  test('should handle unknown characters gracefully', () => {
    const result = converter.convertTextToWingdings('AC');
    expect(result).toBe('\uF041C');
  });

  test('should convert numbers to Wingdings', () => {
    const result = converter.convertTextToWingdings('1');
    expect(result).toBe('\uF031');
  });

  test('should orchestrate Japanese to Romaji to Wingdings conversion', async () => {
    // Mock the convertToRomaji to be predictable for this test
    converter.convertToRomaji = jest.fn().mockReturnValue('AB');
    const result = await converter.convert('こんにちは');
    expect(converter.convertToRomaji).toHaveBeenCalledWith('コンニチハ');
    expect(result).toBe('\uF041\uF042');
  });

  test('should use user dictionary reading for registered words', async () => {
    // Add a word to the user dictionary with a custom reading
    converter.userDictionary.set('テスト単語', 'カスタムヨミ');
    
    // Mock the convertToRomaji to be predictable for this test
    converter.convertToRomaji = jest.fn().mockReturnValue('CUSTOMREADING');
    
    // Mock tokenizer to return a token with surface_form matching dictionary key
    converter.tokenizer = {
      tokenize: (text) => [{
        surface_form: 'テスト単語',
        reading: 'テストタンゴ'  // Default reading from tokenizer
      }]
    };
    
    const result = await converter.convert('テスト単語');
    
    // Should use custom reading from user dictionary, not the tokenizer reading
    expect(converter.convertToRomaji).toHaveBeenCalledWith('カスタムヨミ');
  });

  test('should fall back to tokenizer reading when word is not in user dictionary', async () => {
    // Ensure user dictionary is empty
    converter.userDictionary.clear();
    
    // Mock the convertToRomaji to be predictable for this test
    converter.convertToRomaji = jest.fn().mockReturnValue('TESTROMAJI');
    
    // Mock tokenizer to return a token
    converter.tokenizer = {
      tokenize: (text) => [{
        surface_form: '未登録',
        reading: 'ミトウロク'  // Default reading from tokenizer
      }]
    };
    
    const result = await converter.convert('未登録');
    
    // Should use reading from tokenizer since word is not in dictionary
    expect(converter.convertToRomaji).toHaveBeenCalledWith('ミトウロク');
  });
});