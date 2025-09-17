class DOMManipulator {
  constructor(converter) {
    this.converter = converter;
    this.originalTexts = new WeakMap();
    this.processedElements = new WeakSet();
    this.observer = null;
    this.isConverted = false;
  }

  processNewNodes(nodes) {
    // This function can be implemented later to handle dynamic content.
    console.log('Processing new nodes:', nodes);
  }

  async convertPage() {
    console.log('DOMManipulator: convertPage called');
    if (this.isConverted) return;
    
    const startTime = performance.now();
    const textNodes = this.getTextNodes(document.body);
    
    console.log(`Found ${textNodes.length} text nodes`);
    
    // 大量のテキストノード処理は分割実行
    await this.batchProcess(textNodes, async (batch) => {
      const fragment = document.createDocumentFragment();
      
      for (const node of batch) {
        if (this.processedElements.has(node)) continue;
        
        const originalText = node.textContent;
        if (!this.shouldProcess(originalText)) continue;
        
        try {
          const convertedText = await this.convertText(originalText);
          
          // 元のテキストを保存
          this.originalTexts.set(node, originalText);
          
          // Create a new SPAN element to apply Wingdings font
          const newNode = document.createElement('span');
          newNode.className = 'wingdings-converted'; // Add class for revert
          newNode.style.fontFamily = "Wingdings, 'Zapf Dingbats', monospace";
          newNode.textContent = convertedText;

          // Use the new node as the key to store the original text
          this.originalTexts.set(newNode, originalText);
          
          // Replace the old text node with the new span element
          node.parentNode.replaceChild(newNode, node);
          
          this.processedElements.add(newNode);
        } catch (error) {
          console.error('Conversion failed for node:', error);
          this.markAsUnknown(node);
        }
      }
    });

    this.isConverted = true;
    this.startObserving();
    
    const endTime = performance.now();
    console.log(`Page conversion completed in ${endTime - startTime}ms`);
  }

  async batchProcess(items, processor, batchSize = 100) {
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      await new Promise(resolve => {
        requestIdleCallback(() => {
          processor(batch).then(resolve);
        }, { timeout: 1000 });
      });
      
      // プログレス通知
      if (i % 500 === 0) {
        this.showProgress(i, items.length);
      }
    }
  }

  getTextNodes(element) {
    const textNodes = [];
    const walker = element.ownerDocument.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // スキップするタグ
          const skipTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT'];
          const parentTag = node.parentNode.tagName;
          
          if (skipTags.includes(parentTag)) {
            return NodeFilter.FILTER_REJECT;
          }
          
          // 空白・改行のみはスキップ
          if (!/\S/.test(node.textContent)) {
            return NodeFilter.FILTER_REJECT;
          }
          
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }
    
    return textNodes;
  }

  shouldProcess(text) {
    // 処理対象の判定
    const minLength = 1;
    const maxLength = 10000; // 10KB制限
    
    if (text.length < minLength || text.length > maxLength) {
      return false;
    }
    
    // 日本語・英語が含まれているか
    const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);
    const hasEnglish = /[A-Za-z]/.test(text);
    
    return hasJapanese || hasEnglish;
  }

  async convertText(text) {
    return await this.converter.convert(text);
  }

  markAsUnknown(node) {
    // 未知語マーキング
    const wrapper = document.createElement('span');
    wrapper.className = 'wingdings-unknown';
    wrapper.style.cssText = `
      background-color: rgba(255, 0, 0, 0.6) !important;
      font-weight: bold !important;
      padding: 1px 2px !important;
      border-radius: 2px !important;
      cursor: help !important;
    `;
    wrapper.textContent = `?${node.textContent}`;
    wrapper.title = 'Unknown word - Right click to add to dictionary';
    
    node.parentNode.replaceChild(wrapper, node);
    this.processedElements.add(wrapper);
  }

  revertPage() {
    if (!this.isConverted) return;
    
    this.stopObserving();
    
    // 処理済み要素を復元
    document.querySelectorAll('.wingdings-converted, .wingdings-unknown').forEach(element => {
      const originalText = this.originalTexts.get(element);
      if (originalText) {
        const textNode = document.createTextNode(originalText);
        element.parentNode.replaceChild(textNode, element);
      }
    });
    
    this.processedElements.clear();
    this.originalTexts = new WeakMap();
    this.isConverted = false;
  }

  startObserving() {
    // 動的コンテンツの監視
    this.observer = new MutationObserver((mutations) => {
      const addedNodes = [];
      
      mutations.forEach(mutation => {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === Node.TEXT_NODE || node.nodeType === Node.ELEMENT_NODE) {
            addedNodes.push(node);
          }
        });
      });
      
      if (addedNodes.length > 0) {
        // デバウンス処理
        clearTimeout(this.observerTimeout);
        this.observerTimeout = setTimeout(() => {
          this.processNewNodes(addedNodes);
        }, 500);
      }
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  stopObserving() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  showProgress(current, total) {
    const progress = Math.round((current / total) * 100);
    
    // プログレスバー表示
    let progressBar = document.getElementById('wingdings-progress');
    if (!progressBar) {
      progressBar = document.createElement('div');
      progressBar.id = 'wingdings-progress';
      progressBar.style.cssText = `
        position: fixed !important;
        top: 10px !important;
        right: 10px !important;
        background: rgba(0, 0, 0, 0.8) !important;
        color: white !important;
        padding: 10px !important;
        border-radius: 5px !important;
        z-index: 999999 !important;
        font-family: monospace !important;
      `;
      document.body.appendChild(progressBar);
    }
    
    progressBar.textContent = `Converting... ${progress}% (${current}/${total})`;
    
    if (progress >= 100) {
      setTimeout(() => {
        if (progressBar.parentNode) {
          progressBar.parentNode.removeChild(progressBar);
        }
      }, 2000);
    }
  }
}

module.exports = { DOMManipulator };