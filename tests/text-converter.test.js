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
});