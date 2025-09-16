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
      'ッ': '', // 促音は後で処理
      'ー': '-' // 長音はあとで母音に置換
  };

  // 文字列をカタカナ→ローマ字に変換
  function convertToRomaji(text) {
      let result = '';
      for (let i = 0; i < text.length; i++) {
          let char = text[i];

          // 促音の処理
          if (char === 'ッ') {
              let nextChar = text[i + 1];
              if (nextChar) {
                  let romaji = '';
                  // 先読みして2文字拗音をチェック
                  if (kanaMap[text.substring(i + 1, i + 3)]) {
                      romaji = kanaMap[text.substring(i + 1, i + 3)];
                      result += romaji[0]; // 子音だけ重ねる
                      i++; // 拗音分をスキップ
                      continue;
                  } else if (kanaMap[nextChar]) {
                      romaji = kanaMap[nextChar];
                      result += romaji[0]; // 子音だけ重ねる
                      continue;
                  }
              }
              continue;
          }

          // 拗音や普通の文字を優先して変換
          let twoChar = text.substring(i, i + 2);
          if (kanaMap[twoChar]) {
              result += kanaMap[twoChar];
              i++; // 2文字分進める
          } else if (kanaMap[char]) {
              result += kanaMap[char];
          } else {
              result += char; // マッピングにない場合そのまま
          }
      }

      // 長音「ー」を直前の母音で置換
      result = result.replace(/-/g, function(_, offset) {
          let prev = result[offset - 1] || '';
          if ('AEIOU'.includes(prev.toUpperCase())) return prev.toLowerCase();
          return '';
      });

      return result.toUpperCase();
  }

module.exports = { convertToRomaji };