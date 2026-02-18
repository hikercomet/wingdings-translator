// Shared kana to romaji conversion map (optimized - defined once)
const KANA_MAP = {
    'キャ': 'KYA', 'キュ': 'KYU', 'キョ': 'KYO',
    'シャ': 'SHA', 'シュ': 'SHU', 'ショ': 'SHO', 'シェ': 'SHE',
    'チャ': 'CHA', 'チュ': 'CHU', 'チョ': 'CHO', 'チェ': 'CHE',
    'ニャ': 'NYA', 'ニュ': 'NYU', 'ニョ': 'NYO',
    'ヒャ': 'HYA', 'ヒュ': 'HYU', 'ヒョ': 'HYO',
    'ミャ': 'MYA', 'ミュ': 'MYU', 'ミョ': 'MYO',
    'リャ': 'RYA', 'リュ': 'RYU', 'リョ': 'RYO',
    'ギャ': 'GYA', 'ギュ': 'GYU', 'ギョ': 'GYO',
    'ジャ': 'JA',  'ジュ': 'JU',  'ジョ': 'JO', 'ジェ': 'JE',
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
    'ッ': '', // Sokuon is handled later
    'ー': '-'  // Chōonpu is handled later
};

// Cache for converted strings to avoid repeated conversions
const conversionCache = new Map();
const MAX_CACHE_SIZE = 1000;

function convertToRomaji(text) {
  // Check cache first
  if (conversionCache.has(text)) {
    return conversionCache.get(text);
  }

  let result = '';
  for (let i = 0; i < text.length; i++) {
      let twoChar = text.substring(i, i + 2);
      if (KANA_MAP[twoChar]) {
          result += KANA_MAP[twoChar];
          i++;
          continue;
      }
      let oneChar = text[i];
      if (oneChar === 'ッ') {
          let nextChar = text[i + 1];
          if (nextChar && KANA_MAP[nextChar]) {
              let firstRomajiChar = KANA_MAP[nextChar][0];
              // Don't double 'N' as ッン doesn't geminate
              if (firstRomajiChar !== 'N') {
                result += firstRomajiChar;
              }
          }
          continue;
      }
      result += KANA_MAP[oneChar] || oneChar;
  }

  // Process long vowels in one pass
  result = result.replace(/([AEIOU])-/g, '$1$1');
  const finalResult = result.toUpperCase();

  // Cache the result (with size limit to prevent memory leaks)
  if (conversionCache.size >= MAX_CACHE_SIZE) {
    // Remove oldest entry (first entry in Map)
    const firstKey = conversionCache.keys().next().value;
    conversionCache.delete(firstKey);
  }
  conversionCache.set(text, finalResult);

  return finalResult;
}

// Shared utility to convert hiragana to katakana
function hiraganaToKatakana(text) {
  return text.replace(/[ぁ-ゔ]/g, s => String.fromCharCode(s.charCodeAt(0) + 0x60));
}

// Export the functions and the map for reuse
module.exports = { convertToRomaji, hiraganaToKatakana, KANA_MAP };
