const kuromoji = require('kuromoji');
const { convertToRomaji } = require('../shared/romaji-converter.js');

class TextConverter {
  constructor() {
    this.kuromoji = null;
    this.initPromise = null;
    this.wingdingsMap = {};
    this.emojiMap = {};
  }

  async init(dicPath, mapPath) {
    this.initPromise = Promise.all([
      this.loadKuromoji(dicPath),
      this.loadWingdingsMap(mapPath)
    ]).catch(error => {
      console.error("Initialization failed, converter may not work correctly.", error);
    });
    return this.initPromise;
  }

  async loadKuromoji(dicPath) {
    return new Promise((resolve, reject) => {
      kuromoji.builder({ dicPath }).build((err, tokenizer) => {
        if (err) {
          reject(err);
        } else {
          this.kuromoji = tokenizer;
          console.log('Kuromoji loaded successfully.');
          resolve();
        }
      });
    });
  }

  async loadWingdingsMap(mapPath) {
    try {
      const response = await fetch(mapPath);
      const data = await response.json();
      this.wingdingsMap = data.ascii_to_wingdings;
      this.emojiMap = data.emoji_fallback;
      console.log('Wingdings map loaded:', this.wingdingsMap);
    } catch (error) {
      console.error('Failed to load Wingdings map:', error);
    }
  }

  async convert(text) {
    await this.initPromise;
    
    // Simple check if text contains any Japanese characters
    if (this.kuromoji && /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text)) {
        const tokens = this.kuromoji.tokenize(text);
        const romaji = tokens.map(token => {
            const reading = token.reading || token.surface_form;
            // If the token is not Japanese, it doesn't need romaji conversion.
            if (!/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(reading)) {
                return reading;
            }
            return convertToRomaji(reading);
        }).join('');
        return this.convertTextToWingdings(romaji);
    } else {
        // If no Japanese or kuromoji is not loaded, treat the whole text as English/other
        return this.convertTextToWingdings(text);
    }
  }

  convertTextToWingdings(text) {
    let result = '';
    for (const char of text.toUpperCase()) {
      if (this.wingdingsMap[char]) {
        result += this.wingdingsMap[char];
      } else {
        result += char; // Keep character if no mapping exists
      }
    }
    return result;
  }

  isJapanese(text) {
    return /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);
  }

  
}

module.exports = { TextConverter };
