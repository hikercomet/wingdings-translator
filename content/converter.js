const kuromoji = require('kuromoji');
const wingdingsMapData = require('../data/wingdings-map.json');
const { convertToRomaji: sharedConvertToRomaji } = require('../shared/romaji-converter.js');

class TextConverter {
  constructor() {
    this.tokenizer = null; // Renamed from kuromoji for clarity
    // wingdingsMap used only for reverse conversion
    this.wingdingsMap = wingdingsMapData.ascii_to_wingdings;
    // Lazy-load reverse map to save memory on initialization
    this._reverseWingdingsMap = null;
    // User dictionary for custom word readings
    this.userDictionary = {};
  }

  get reverseWingdingsMap() {
    if (!this._reverseWingdingsMap) {
      this._reverseWingdingsMap = Object.fromEntries(
        Object.entries(this.wingdingsMap).map(([k, v]) => [v, k])
      );
    }
    return this._reverseWingdingsMap;
  }

  async init(dicPath) {
    return new Promise(async (resolve, reject) => {
      // Load user dictionary for custom word readings
      try {
        const response = await chrome.runtime.sendMessage({ type: 'GET_USER_DICTIONARY' });
        if (response && response.success && response.dictionary) {
          this.userDictionary = response.dictionary;
          console.log('TextConverter: User dictionary loaded with', Object.keys(this.userDictionary).length, 'words.');
        }
      } catch (e) {
        console.error('Failed to load user dictionary:', e);
      }

      kuromoji.builder({ dicPath }).build((err, tokenizer) => {
        if (err) reject(err);
        else { this.tokenizer = tokenizer; resolve(); }
      });
    });
  }

  async tokenizeAsync(text) {
    if (!this.tokenizer) throw new Error('Tokenizer not initialized');
    return this.tokenizer.tokenize(text);
  }

  async convert(text) {
    if (!this.tokenizer) return text;
    const tokens = this.tokenizer.tokenize(text);
    
    const romajiParts = tokens.map(token => {
        const surfaceForm = token.surface_form;
        
        // Check user dictionary first for custom readings
        if (this.userDictionary[surfaceForm]) {
          const userEntry = this.userDictionary[surfaceForm];
          // Convert hiragana reading to katakana for consistent processing
          const readingInKatakana = userEntry.reading.replace(/[ぁ-ゔ]/g, s => String.fromCharCode(s.charCodeAt(0) + 0x60));
          console.log('[Wingdings-Converter] Using user dictionary for:', surfaceForm, '->', readingInKatakana);
          return this.convertToRomaji(readingInKatakana);
        }
        
        const reading = token.reading || surfaceForm;
        if (!/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(reading)) {
            return reading;
        }
        return this.convertToRomaji(reading);
    });

    const romaji = romajiParts.join('');
    return this.convertTextToWingdings(romaji);
  }

  convertTextToWingdings(text) {
    return text.toUpperCase();
  }

  convertFromWingdings(text) {
    let result = '';
    for (const char of text) {
      result += this.reverseWingdingsMap[char] || char;
    }
    return result;
  }

  convertToRomaji(text) {
      console.log('[Wingdings-Converter] convertToRomaji input:', text);
      // Convert hiragana to katakana for consistent processing
      const katakanaText = text.replace(/[ぁ-ゔ]/g, s => String.fromCharCode(s.charCodeAt(0) + 0x60));
      // Use shared, optimized conversion function
      const result = sharedConvertToRomaji(katakanaText);
      console.log('[Wingdings-Converter] convertToRomaji output:', result);
      return result;
  }
}

module.exports = { TextConverter };
