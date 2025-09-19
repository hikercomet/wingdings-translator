class DOMManipulator {
  constructor(converter) {
    this.converter = converter;
    this.convertedNodes = new Map();
    this.observer = null;
    this.isConverted = false;
  }

  processNewNodes(nodes) {
    // This function can be implemented later to handle dynamic content.
    console.log('Processing new nodes:', nodes);
  }

  async convertPage(converter) {
    console.log('DOMManipulator: convertPage called');
    if (this.isConverted) return;
    
    const startTime = performance.now();
    const textNodes = this.getTextNodes(document.body);
    
    console.log(`Found ${textNodes.length} text nodes`);
    
    await this.batchProcess(textNodes, async (batch) => {
      for (const node of batch) {
        if (!node.parentNode) continue; // Node may have been removed by a previous operation
        const originalText = node.textContent;
        if (!this.shouldProcess(originalText)) continue;
        
        try {
          const convertedText = await this.convertText(originalText, converter);
          
          const newNode = document.createElement('span');
          newNode.className = 'wingdings-converted';
          newNode.style.fontFamily = "Wingdings, 'Zapf Dingbats', monospace";
          newNode.textContent = convertedText;

          node.parentNode.replaceChild(newNode, node);
          
          this.convertedNodes.set(newNode, node);
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
          const skipTags = ['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT'];
          const parentTag = node.parentNode.tagName;
          
          if (skipTags.includes(parentTag)) {
            return NodeFilter.FILTER_REJECT;
          }
          
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
    const minLength = 1;
    const maxLength = 10000;
    
    if (text.length < minLength || text.length > maxLength) {
      return false;
    }
    
    const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(text);
    const hasEnglish = /[A-Za-z]/.test(text);
    
    return hasJapanese || hasEnglish;
  }

  async convertText(text, converter) {
    return await converter.convert(text);
  }

  markAsUnknown(node) {
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
    this.convertedNodes.set(wrapper, node);
  }

  revertPage() {
    if (!this.isConverted) return;
    
    this.stopObserving();

    for (const [newNode, originalNode] of this.convertedNodes.entries()) {
      if (newNode.parentNode) {
        newNode.parentNode.replaceChild(originalNode, newNode);
      }
    }

    this.convertedNodes.clear();
    this.isConverted = false;
    console.log('Page reverted.');
  }

  startObserving() {
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