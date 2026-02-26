const kuromoji = require('kuromoji');
const wingdingsMapData = require('../data/wingdings-map.json');
const { convertToRomaji: sharedConvertToRomaji } = require('../shared/romaji-converter.js');

// Constants
const POS_SYMBOL = '記号'; // Part-of-speech marker for symbols/unknown characters
const JAPANESE_TEXT_REGEX = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/;

class TextConverter {
  constructor() {
    this.tokenizer = null; // Renamed from kuromoji for clarity
    // wingdingsMap used only for reverse conversion
    this.wingdingsMap = wingdingsMapData.ascii_to_wingdings;
    // Lazy-load reverse map to save memory on initialization
    this._reverseWingdingsMap = null;
    // User dictionary for custom word readings
    this.userDictionary = new Map();
  }

  get reverseWingdingsMap() {
    if (!this._reverseWingdingsMap) {
      this._reverseWingdingsMap = Object.fromEntries(
        Object.entries(this.wingdingsMap).map(([k, v]) => [v, k])
      );
    }
    return this._reverseWingdingsMap;
  }

  // Helper method to count actual characters (handles surrogate pairs correctly)
  getCharacterCount(text) {
    return Array.from(text).length;
  }

  async loadUserDictionary() {
    // Load user dictionary for custom word readings
    try {
      const response = await chrome.runtime.sendMessage({ type: 'GET_USER_DICTIONARY' });
      if (response && response.success && response.dictionary) {
        // Store user dictionary as a Map for O(1) lookup during conversion
        this.userDictionary.clear();
        Object.entries(response.dictionary).forEach(([kanji, data]) => {
          // Store reading in katakana for consistent processing
          const readingInKatakana = data.reading.replace(/[ぁ-ゔ]/g, s => String.fromCharCode(s.charCodeAt(0) + 0x60));
          this.userDictionary.set(kanji, readingInKatakana);
        });
      }
    } catch (e) {
      console.error('Converter: Failed to load user dictionary:', e);
    }
  }

  async init(dicPath) {
    return new Promise(async (resolve, reject) => {

      await this.loadUserDictionary();

      const builderOptions = { dicPath };

      kuromoji.builder(builderOptions).build((err, tokenizer) => {
        if (err) {
          console.error('Converter: Kuromoji build failed.', err);
          reject(err);
        } else {
          this.tokenizer = tokenizer;
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
    if (!JAPANESE_TEXT_REGEX.test(text)) {
      return this.convertTextToWingdings(text);
    }

    // Reload user dictionary before conversion to ensure latest data
    await this.loadUserDictionary();
    const tokens = this.tokenizer.tokenize(text);
    
    // Check if tokenization covered all characters (kuromoji bug with supplementary plane)
    const tokenizedLength = tokens.reduce((sum, token) => sum + this.getCharacterCount(token.surface_form), 0);
    const actualTextLength = this.getCharacterCount(text);
    if (tokenizedLength < actualTextLength) {
      // Find the untokenized part and process character by character
      const textChars = Array.from(text);
      const tokenizedChars = new Set();
      
      // Mark all tokenized positions
      for (const token of tokens) {
        const startPos = token.word_position - 1;
        const tokenChars = Array.from(token.surface_form);
        for (let i = 0; i < tokenChars.length; i++) {
          tokenizedChars.add(startPos + i);
        }
      }
      
      // Find untokenized characters
      let currentUntokenized = '';
      let startPos = 0;
      for (let i = 0; i < textChars.length; i++) {
        if (!tokenizedChars.has(i)) {
          if (currentUntokenized === '') {
            startPos = i;
          }
          currentUntokenized += textChars[i];
        } else if (currentUntokenized) {
          // Add accumulated untokenized characters as pseudo-token
          tokens.push({
            surface_form: currentUntokenized,
            reading: null,
            pos: POS_SYMBOL,
            word_position: startPos + 1
          });
          currentUntokenized = '';
        }
      }
      // Add remaining untokenized characters
      if (currentUntokenized) {
        tokens.push({
          surface_form: currentUntokenized,
          reading: null,
          pos: POS_SYMBOL,
          word_position: startPos + 1
        });
      }
    }
    
    const romajiParts = tokens.map(token => {
        // Check user dictionary first for custom readings
        const surfaceForm = token.surface_form;
        const userReading = this.userDictionary.get(surfaceForm);
        
        let reading;
        if (userReading) {
          // Use custom reading from user dictionary
          reading = userReading;
        } else if (!token.reading && this.userDictionary.size > 0) {
          // If no reading provided by tokenizer, try character-by-character lookup
          reading = this.getCharacterByCharacterReading(surfaceForm);
          if (reading !== surfaceForm) {
            // Successfully found some character readings
          } else {
            // Fall back to surface form if no character readings found
            reading = surfaceForm;
          }
        } else {
          // Fall back to tokenizer reading or surface form
          reading = token.reading || surfaceForm;
        }
        
        if (!JAPANESE_TEXT_REGEX.test(reading)) {
            return reading;
        }
        return this.convertToRomaji(reading);
    });

    const romaji = romajiParts.join('');
    return this.convertTextToWingdings(romaji);
  }

  getCharacterByCharacterReading(text) {
    // Try to construct reading from individual characters in user dictionary
    let result = '';
    let foundAny = false;
    
    for (const char of text) {
      const charReading = this.userDictionary.get(char);
      if (charReading) {
        result += charReading;
        foundAny = true;
      } else {
        // Check if character itself is kana/kanji and needs conversion
        // For unknown characters, keep them as-is
        result += char;
      }
    }
    
    // Only return the constructed reading if we found at least one character
    return foundAny ? result : text;
  }

  calculateLastTokenEndPosition(tokens) {
    // Calculate the end position of the last token
    // Note: word_position in kuromoji is 1-indexed, not 0-indexed
    if (tokens.length === 0) {
      return 0;
    }
    const lastToken = tokens[tokens.length - 1];
    const tokenStartPosition = lastToken.word_position - 1; // Convert to 0-indexed
    const tokenLength = this.getCharacterCount(lastToken.surface_form);
    return tokenStartPosition + tokenLength;
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
      // Convert hiragana to katakana for consistent processing
      const katakanaText = text.replace(/[ぁ-ゔ]/g, s => String.fromCharCode(s.charCodeAt(0) + 0x60));
      // Use shared, optimized conversion function
      return sharedConvertToRomaji(katakanaText);
  }
}

module.exports = { TextConverter };
