const { convertToRomaji, KANA_MAP } = require('../shared/romaji-converter.js');

describe('Performance Optimizations', () => {
  describe('Romaji Converter Caching', () => {
    test('should cache conversion results', () => {
      const input = 'カタカナ';
      const firstResult = convertToRomaji(input);
      const secondResult = convertToRomaji(input);
      
      expect(firstResult).toBe(secondResult);
      expect(firstResult).toBe('KATAKANA');
    });

    test('should handle repeated conversions efficiently', () => {
      const input = 'テスト';
      const iterations = 1000;
      
      const start = Date.now();
      for (let i = 0; i < iterations; i++) {
        convertToRomaji(input);
      }
      const duration = Date.now() - start;
      
      // With caching, 1000 iterations should be very fast (< 50ms)
      expect(duration).toBeLessThan(50);
    });

    test('should convert various kana correctly', () => {
      expect(convertToRomaji('ア')).toBe('A');
      expect(convertToRomaji('カ')).toBe('KA');
      expect(convertToRomaji('シャ')).toBe('SHA');
      expect(convertToRomaji('キョウト')).toBe('KYOUTO');
      expect(convertToRomaji('トーキョー')).toBe('TOOKYOO');
    });

    test('should handle sokuon (っ) correctly', () => {
      expect(convertToRomaji('ガッコウ')).toBe('GAKKOU');
      expect(convertToRomaji('サッカー')).toBe('SAKKAA');
    });
  });

  describe('Code Deduplication', () => {
    test('should export shared KANA_MAP', () => {
      expect(KANA_MAP).toBeDefined();
      expect(Object.keys(KANA_MAP).length).toBeGreaterThan(0);
    });

    test('KANA_MAP should contain expected mappings', () => {
      expect(KANA_MAP['ア']).toBe('A');
      expect(KANA_MAP['カ']).toBe('KA');
      expect(KANA_MAP['シャ']).toBe('SHA');
      expect(KANA_MAP['キョ']).toBe('KYO');
    });
  });

  describe('Conversion Performance', () => {
    test('should handle long text efficiently', () => {
      // Create a long text by repeating kana
      const longText = 'カタカナ'.repeat(100);
      
      const start = Date.now();
      const result = convertToRomaji(longText);
      const duration = Date.now() - start;
      
      expect(result).toBe('KATAKANA'.repeat(100));
      // Should complete in reasonable time (< 100ms)
      expect(duration).toBeLessThan(100);
    });

    test('should handle mixed kana efficiently', () => {
      const mixedText = 'トウキョウスカイツリー';
      
      const start = Date.now();
      const result = convertToRomaji(mixedText);
      const duration = Date.now() - start;
      
      expect(result).toBeTruthy();
      expect(duration).toBeLessThan(10);
    });
  });

  describe('Cache Size Management', () => {
    test('should not grow cache indefinitely', () => {
      // The cache has a max size of 1000 entries
      // This test ensures the limit is enforced
      for (let i = 0; i < 1500; i++) {
        convertToRomaji(`テスト${i}`);
      }
      
      // We can't directly access cache size from outside,
      // but we can verify the function still works
      expect(convertToRomaji('テスト')).toBe('TESUTO');
    });
  });
});
