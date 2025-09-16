interface WindowWithTranslator extends Window {
  wingdingsTranslatorOriginals?: Map<Node, string>;
}

const customWindow = window as unknown as WindowWithTranslator;

const wingdingsMap: { [key: string]: string } = {
  'A': 'A', 'B': 'B', 'C': 'C', 'D': 'D', 'E': 'E', 'F': 'F', 'G': 'G', 'H': 'H', 'I': 'I', 'J': 'J', 'K': 'K', 'L': 'L', 'M': 'M', 'N': 'N', 'O': 'O', 'P': 'P', 'Q': 'Q', 'R': 'R', 'S': 'S', 'T': 'T', 'U': 'U', 'V': 'V', 'W': 'W', 'X': 'X', 'Y': 'Y', 'Z': 'Z',
  'a': 'a', 'b': 'b', 'c': 'c', 'd': 'd', 'e': 'e', 'f': 'f', 'g': 'g', 'h': 'h', 'i': 'i', 'j': 'j', 'k': 'k', 'l': 'l', 'm': 'm', 'n': 'n', 'o': 'o', 'p': 'p', 'q': 'q', 'r': 'r', 's': 's', 't': 't', 'u': 'u', 'v': 'v', 'w': 'w', 'x': 'x', 'y': 'y', 'z': 'z',
  '0': '0', '1': '1', '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
  ' ': ' ', '.': '.', ',': ',', '!': '!', '?': '?', '(': '(', ')': ')', '&': '&', '+': '+', '-': '-', '=': '='
};

const originalTexts = customWindow.wingdingsTranslatorOriginals || new Map<Node, string>();
customWindow.wingdingsTranslatorOriginals = originalTexts;

// Import wanakana and kuromojin
import * as wanakana from 'wanakana';
import { getTokenizer } from 'kuromojin';

// Initialize the tokenizer
const tokenizerPromise = getTokenizer();

const translateNode = async (node: Node) => {
    if (node.nodeType === Node.TEXT_NODE && node.textContent && node.textContent.trim() !== '') {
        const parent = node.parentNode;
        if (parent && (parent.nodeName !== 'SCRIPT') && (parent.nodeName !== 'STYLE')) {
            if (!originalTexts.has(node)) {
                originalTexts.set(node, node.textContent);
            }

            // Ask the background script to convert to Romaji.
            const response = await chrome.runtime.sendMessage({ type: 'convertToRomaji', text: node.textContent });
            const textToTranslate = response.text;

            node.textContent = textToTranslate.split('').map((char: string) => wingdingsMap[char] || char).join('');
        }
    }

    for (const child of Array.from(node.childNodes)) {
        await translateNode(child);
    }
};

const revertNode = (node: Node) => {
    if (originalTexts.has(node)) {
        node.textContent = originalTexts.get(node)!;
    }
    node.childNodes.forEach(revertNode);
};

chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
  if (request.action === "translatePage") {
    translateNode(document.body).then(() => {
        document.body.style.fontFamily = 'Wingdings';
        sendResponse({ status: 'done' });
    });
    return true; // Indicates an asynchronous response
  } else if (request.action === "revertPage") {
    revertNode(document.body);
    document.body.style.fontFamily = '';
    originalTexts.clear();
    delete customWindow.wingdingsTranslatorOriginals;
    sendResponse({ status: 'done' });
  } else if (request.type === 'convertToRomaji') { // This is the message from background script
    // Perform kuromojin tokenization and wanakana conversion directly in content script
    tokenizerPromise.then((tokenizer: any) => {
      const tokens = tokenizer.tokenize(request.text);
      const romaji = wanakana.toRomaji(tokens.map((token: any) => token.reading || token.surface_form).join(''));
      sendResponse({ text: romaji });
    }).catch((error: any) => {
      console.error("Kuromoji Error in content script:", error);
      // Fallback to original wanakana behavior if kuromoji fails
      const romaji = wanakana.toRomaji(request.text);
      sendResponse({ text: romaji });
    });
    return true; // Indicates an asynchronous response
  }
});

// Send ready signal to background script
chrome.runtime.sendMessage({ type: 'contentScriptReady' });
