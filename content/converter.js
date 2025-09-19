const kuromoji = require('kuromoji');
const wingdingsMapData = require('../data/wingdings-map.json');

class TextConverter {
  constructor() {
    this.tokenizer = null; // Renamed from kuromoji for clarity
    this.wingdingsMap = wingdingsMapData.ascii_to_wingdings;
    this.reverseWingdingsMap = Object.fromEntries(Object.entries(this.wingdingsMap).map(([k, v]) => [v, k]));
  }

  async init(dicPath) {
    return new Promise((resolve, reject) => {
      kuromoji.builder({ dicPath }).build((err, tokenizer) => {
        if (err) reject(err);
        else { this.tokenizer = tokenizer; resolve(); }
      });
    });
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
    let result = '';
    for (const char of text.toUpperCase()) {
      result += this.wingdingsMap[char] || char;
    }
    return result;
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
      const katakanaText = text.replace(/[ぁ-ゔ]/g, s => String.fromCharCode(s.charCodeAt(0) + 0x60));

      const kanaMap = {
          'キャ': 'KYA', 'キュ': 'KYU', 'キョ': 'KYO',
          'シャ': 'SHA', 'シュ': 'SHU', 'ショ': 'SHO', 'シェ': 'SHE',
          'チャ': 'CHA', 'チュ': 'CHU', 'チョ': 'CHO', 'チェ': 'CHE',
          'ニャ': 'NYA', 'ニュ': 'NYU', 'ニョ': 'NYO',
          'ヒャ': 'HYA', 'ヒュ': 'HYU', 'ヒョ': 'HYO',
          'ミャ': 'MYA', 'ミュ': 'MYU', 'ミョ': 'MYO',
          'リャ': 'RYA', 'リュ': 'RYU', 'リョ': 'RYO',
          'ギャ': 'GYA', 'ギュ': 'GYU', 'ギョ': 'GYO',
          'ジャ': 'JA', 'ジュ': 'JU', 'ジョ': 'JO', 'ジェ': 'JE',
          'ビャ': 'BYA', 'ビュ': 'BYU', 'ビョ': 'BYO',
          'ピャ': 'PYA', 'ピュ': 'PYU', 'ピョ': 'PYO',
          'ティ': 'TI', 'トゥ': 'TU',
          'ディ': 'DI', 'ドゥ': 'DU',
          'ファ': 'FA', 'フィ': 'FI', 'フェ': 'FE', 'フォ': 'FO',
          'ウィ': 'WI', 'ウェ': 'WE', 'ウォ': 'WO',
          'ヴァ': 'VA', 'ヴィ': 'VI', 'ヴ': 'VU', 'ヴェ': 'VE', 'ヴォ': 'VO',
          'ア': 'A', 'イ': 'I', 'ウ': 'U', 'エ': 'E', 'オ': 'O',
          'カ': 'KA', 'キ': 'KI', 'ク': 'KU', 'ケ': 'KE', 'コ': 'KO',
          'ガ': 'GA', 'ギ': 'GI', 'グ': 'GU', 'ゲ': 'GE', 'ゴ': 'GO',
          'サ': 'SA', 'シ': 'SHI', 'ス': 'SU', 'セ': 'SE', 'ソ': 'SO',
          'ザ': 'ZA', 'ジ': 'JI', 'ズ': 'ZU', 'ゼ': 'ZE', 'ゾ': 'ZO',
          'タ': 'TA', 'チ': 'CHI', 'ツ': 'TSU', 'テ': 'TE', 'ト': 'TO',
          'ダ': 'DA', 'ヂ': 'DI', 'ヅ': 'DU', 'デ': 'DE', 'ド': 'DO',
          'ナ': 'NA', 'ニ': 'NI', 'ヌ': 'NU', 'ネ': 'NE', 'ノ': 'NO',
          'ハ': 'HA', 'ヒ': 'HI', 'フ': 'FU', 'ヘ': 'HE', 'ホ': 'HO',
          'バ': 'BA', 'ビ': 'BI', 'ブ': 'BU', 'ベ': 'BE', 'ボ': 'BO',
          'パ': 'PA', 'ピ': 'PI', 'プ': 'PU', 'ペ': 'PE', 'ポ': 'PO',
          'マ': 'MA', 'ミ': 'MI', 'ム': 'MU', 'メ': 'ME', 'モ': 'MO',
          'ヤ': 'YA', 'ユ': 'YU', 'ヨ': 'YO',
          'ラ': 'RA', 'リ': 'RI', 'ル': 'RU', 'レ': 'RE', 'ロ': 'RO',
          'ワ': 'WA', 'ヰ': 'I', 'ヱ': 'E', 'ヲ': 'O', 'ン': 'N',
          'ァ': 'A', 'ィ': 'I', 'ゥ': 'U', 'ェ': 'E', 'ォ': 'O',
          'ッ': '', // This will be handled separately
          'ー': '-'
      };
      let result = '';
      let textToProcess = katakanaText;

      for (let i = 0; i < textToProcess.length; i++) {
          let twoChar = textToProcess.substring(i, i + 2);
          if (kanaMap[twoChar]) {
              result += kanaMap[twoChar];
              i++;
              continue;
          }
          let oneChar = textToProcess[i];
          if (oneChar === 'ッ') {
              let nextChar = textToProcess[i + 1];
              if (nextChar && kanaMap[nextChar]) {
                  let firstRomajiChar = kanaMap[nextChar][0];
                  if (firstRomajiChar !== 'N') {
                    result += firstRomajiChar;
                  }
              }
              continue;
          }
          result += kanaMap[oneChar] || oneChar;
      }
      result = result.replace(/([AEIOU])-/g, '$1$1');
      console.log('[Wingdings-Converter] convertToRomaji output:', result);
      return result.toUpperCase();
  }
}

module.exports = { TextConverter };
