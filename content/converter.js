const kuromoji = require('kuromoji');
const wingdingsMapData = require('../data/wingdings-map.json');

class TextConverter {
  constructor() {
    this.kuromoji = null;
    this.wingdingsMap = wingdingsMapData.ascii_to_wingdings;
    this.reverseWingdingsMap = Object.fromEntries(Object.entries(this.wingdingsMap).map(([k, v]) => [v, k]));
  }

  async init(dicPath) {
    return new Promise((resolve, reject) => {
      kuromoji.builder({ dicPath }).build((err, tokenizer) => {
        if (err) reject(err);
        else { this.kuromoji = tokenizer; resolve(); }
      });
    });
  }

  async convert(text) {
    if (!this.kuromoji) return text;
    const tokens = this.kuromoji.tokenize(text);
    const romaji = tokens.map(token => {
        const reading = token.reading || token.surface_form;
        if (!/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(reading)) {
            return reading;
        }
        return this.convertToRomaji(reading);
    }).join('');
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
      const kanaMap = {
          'キャ': 'KYA', 'キュ': 'KYU', 'キョ': 'KYO',
          'シャ': 'SHA', 'シュ': 'SHU', 'ショ': 'SHO',
          'チャ': 'CHA', 'チュ': 'CHU', 'チョ': 'CHO',
          'ニャ': 'NYA', 'ニュ': 'NYU', 'ニョ': 'NYO',
          'ヒャ': 'HYA', 'ヒュ': 'HYU', 'ヒョ': 'HYO',
          'ミャ': 'MYA', 'ミュ': 'MYU', 'ミョ': 'MYO',
          'リャ': 'RYA', 'リュ': 'RYU', 'リョ': 'RYO',
          'ギャ': 'GYA', 'ギュ': 'GYU', 'ギョ': 'GYO',
          'ジャ': 'JA',  'ジュ': 'JU',  'ジョ': 'JO',
          'ビャ': 'BYA', 'ビュ': 'BYU', 'ビョ': 'BYO',
          'ピャ': 'PYA', 'ピュ': 'PYU', 'ピョ': 'PYO',
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
          'ワ': 'WA', 'ヰ': 'WI', 'ヱ': 'WE', 'ヲ': 'WO', 'ン': 'N',
          'ァ': 'A', 'ィ': 'I', 'ゥ': 'U', 'ェ': 'E', 'ォ': 'O',
          'ッ': '',
          'ー': '-'
      };
      let result = '';
      for (let i = 0; i < text.length; i++) {
          let twoChar = text.substring(i, i + 2);
          if (kanaMap[twoChar]) {
              result += kanaMap[twoChar];
              i++;
              continue;
          }
          let oneChar = text[i];
          if (oneChar === 'ッ') {
              let nextChar = text[i + 1];
              if (nextChar && kanaMap[nextChar]) {
                  result += kanaMap[nextChar][0];
              }
              continue;
          }
          result += kanaMap[oneChar] || oneChar;
      }
      result = result.replace(/([AEIOU])-/g, '$1$1');
      return result.toUpperCase();
  }
}

module.exports = { TextConverter };
