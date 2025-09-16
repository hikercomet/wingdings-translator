import { useState } from 'react';
import * as wanakana from 'wanakana';

// Wingdings characters are just ASCII characters displayed with the Wingdings font.
const wingdingsMap: { [key: string]: string } = {
  'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D', 'E': 'E', 'F': 'F', 'G': 'G', 'H': 'H', 'I': 'I', 'J': 'J', 'K': 'K', 'L': 'L', 'M': 'M', 'N': 'N', 'O': 'O', 'P': 'P', 'Q': 'Q', 'R': 'R', 'S': 'S', 'T': 'T', 'U': 'U', 'V': 'V', 'W': 'W', 'X': 'X', 'Y': 'Y', 'Z': 'Z',
  'a': 'a', 'b': 'b', 'c': 'c', 'd': 'd', 'e': 'e', 'f': 'f', 'g': 'g', 'h': 'h', 'i': 'i', 'j': 'j', 'k': 'k', 'l': 'l', 'm': 'm', 'n': 'n', 'o': 'o', 'p': 'p', 'q': 'q', 'r': 'r', 's': 's', 't': 't', 'u': 'u', 'v': 'v', 'w': 'w', 'x': 'x', 'y': 'y', 'z': 'z',
  '0': '0', '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
  ' ': ' ', '.': '.', ',': ',', '!': '!', '?': '?', '(': '(', ')': ')', '&': '&', '+': '+', '-': '-', '=': '='
};

const App = () => {
  const [inputText, setInputText] = useState('こんにちは');

  const handleInputChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputText(event.target.value);
  };

  const handleCopy = () => {
    // We copy the original text, not the Wingdings version
    navigator.clipboard.writeText(inputText).then(() => {
      alert('Original text copied to clipboard!');
    });
  };

  const textToTranslate = wanakana.isJapanese(inputText) ? wanakana.toRomaji(inputText) : inputText;
  const translatedText = textToTranslate.split('').map(char => wingdingsMap[char] || char).join('');

  return (
    <div className="container-fluid p-3">
      <h4 className="mb-3">Wingdings Translator</h4>
      
      <div className="mb-3">
        <label htmlFor="text-input" className="form-label">Your Text</label>
        <textarea 
          id="text-input" 
          className="form-control" 
          rows={4} 
          value={inputText} 
          onChange={handleInputChange}
        />
      </div>

      <div className="mb-3">
        <label htmlFor="wingdings-output" className="form-label">Wingdings Output</label>
        <div className="position-relative">
          <textarea 
            id="wingdings-output" 
            className="form-control" 
            rows={4} 
            readOnly 
            style={{ fontFamily: 'Wingdings', fontSize: '1.5rem' }} 
            value={translatedText}
          />
          <button 
            className="btn btn-sm btn-outline-secondary position-absolute top-0 end-0 m-2" 
            onClick={handleCopy}
            disabled={!inputText}
          >
            Copy
          </button>
        </div>
      </div>

      <div className="mt-4">
        <h6>Character Map</h6>
        <div className="p-2 border rounded" style={{ fontFamily: 'Wingdings', fontSize: '1.2rem', lineHeight: '1.8', wordBreak: 'break-all' }}>
          {Object.keys(wingdingsMap).map(char => wingdingsMap[char]).join(' ')}
        </div>
      </div>
    </div>
  );
};

export default App;
