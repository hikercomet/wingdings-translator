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
        console.log('Converter: Requesting user dictionary from background...');
        const response = await chrome.runtime.sendMessage({ type: 'GET_USER_DICTIONARY' });
        if (response && response.success && response.dictionary) {
          console.log('Converter: User dictionary received from background:', response.dictionary);
          userDic = Object.entries(response.dictionary).map(([kanji, data]) => {
            // Simplified 3-part CSV format for Kuromoji user dictionary:
            // surface_form,part_of_speech,reading
            const readingInKatakana = data.reading.replace(/[ぁ-ゔ]/g, s => String.fromCharCode(s.charCodeAt(0) + 0x60));
            return `${kanji},名詞,${readingInKatakana}`;
          });
        }
      } catch (e) {
        console.error('Converter: Failed to load user dictionary:', e);
      }

      const builderOptions = { dicPath };
      if (userDic.length > 0) {
        builderOptions.userDic = userDic;
        console.log('Converter: Initializing Kuromoji with user dictionary:', userDic);
      } else {
        console.log('Converter: Initializing Kuromoji without user dictionary.');
      }

      kuromoji.builder(builderOptions).build((err, tokenizer) => {
        if (err) {
          console.error('Converter: Kuromoji build failed.', err);
          reject(err);
        } else {
          this.tokenizer = tokenizer;
          console.log('Converter: Kuromoji initialized successfully.');
          resolve();
        }
      });
    });
  }

  async tokenizeAsync(text) {
    if (!this.tokenizer) throw new Error('Tokenizer not initialized');
    return this.tokenizer.tokenize(text);
  }

  async convert(text) {
    if (!this.tokenizer) {
      console.error('Converter: Tokenizer not initialized before convert call.');
      return text;
    }
    console.log('Converter: Tokenizing text:', text);
    const tokens = this.tokenizer.tokenize(text);
    console.log('Converter: Tokens:', tokens);
    
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