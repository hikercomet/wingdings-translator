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
      let userDic = [];
      try {
        const response = await chrome.runtime.sendMessage({ type: 'GET_USER_DICTIONARY' });
        if (response && response.success && response.dictionary) {
          userDic = Object.entries(response.dictionary).map(([kanji, data]) => {
            // Kuromoji user dictionary format:
            // surface_form,left_id,right_id,cost,reading
            // We'll use default IDs and cost, but provide the correct reading.
            const readingInKatakana = data.reading.replace(/[ぁ-ゔ]/g, s => String.fromCharCode(s.charCodeAt(0) + 0x60));
            return `${kanji},1,1,1000,${readingInKatakana},名詞,固有名詞,*,*`;
          });
        }
      } catch (e) {
        console.error('Failed to load user dictionary:', e);
      }

      const builderOptions = { dicPath };
      if (userDic.length > 0) {
        builderOptions.userDic = userDic;
        console.log('Kuromoji initialized with user dictionary of', userDic.length, 'words.');
      }

      kuromoji.builder(builderOptions).build((err, tokenizer) => {
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
        const reading = token.reading || token.surface_form;
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
