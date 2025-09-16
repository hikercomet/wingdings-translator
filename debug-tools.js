// debug-tools.js - 開発・デバッグ支援ツール
class WingdingsDebugTools {
  constructor() {
    this.debugMode = false;
    this.logLevel = 'info'; // debug, info, warn, error
    this.setupConsoleCommands();
  }

  setupConsoleCommands() {
    // デバッグモードの切り替え
    window.wingdingsDebug = {
      enable: () => this.enableDebugMode(),
      disable: () => this.disableDebugMode(),
      status: () => this.getStatus(),
      test: () => this.runTests(),
      benchmark: () => this.runBenchmarks(),
      clear: () => this.clearCache(),
      export: () => this.exportDebugData()
    };
  }

  enableDebugMode() {
    this.debugMode = true;
    
    // デバッグ用CSSを追加
    const debugStyle = document.createElement('style');
    debugStyle.id = 'wingdings-debug-style';
    debugStyle.textContent = `
      .wingdings-debug-info {
        position: fixed !important;
        top: 50px !important;
        right: 10px !important;
        background: rgba(0, 0, 0, 0.9) !important;
        color: #00ff00 !important;
        font-family: monospace !important;
        font-size: 12px !important;
        padding: 10px !important;
        border-radius: 5px !important;
        z-index: 999999 !important;
        max-width: 300px !important;
        max-height: 400px !important;
        overflow-y: auto !important;
      }
      
      .wingdings-converted {
        outline: 2px solid #ff0000 !important;
        background: rgba(255, 0, 0, 0.1) !important;
      }
      
      .wingdings-unknown {
        outline: 2px solid #ff9800 !important;
        background: rgba(255, 152, 0, 0.2) !important;
      }
    `;
    document.head.appendChild(debugStyle);
    
    this.showDebugInfo();
    console.log(' Wingdings Debug Mode Enabled');
    console.log('Available commands: wingdingsDebug.*');
  }

  disableDebugMode() {
    this.debugMode = false;
    
    const debugStyle = document.getElementById('wingdings-debug-style');
    if (debugStyle) debugStyle.remove();
    
    const debugInfo = document.getElementById('wingdings-debug-info');
    if (debugInfo) debugInfo.remove();
    
    console.log(' Wingdings Debug Mode Disabled');
  }

  showDebugInfo() {
    if (!this.debugMode) return;
    
    let debugInfo = document.getElementById('wingdings-debug-info');
    if (!debugInfo) {
      debugInfo = document.createElement('div');
      debugInfo.id = 'wingdings-debug-info';
      debugInfo.className = 'wingdings-debug-info';
      document.body.appendChild(debugInfo);
    }
    
    const stats = this.collectStats();
    debugInfo.innerHTML = `
      <h4> Wingdings Debug</h4>
      <div><strong>Status:</strong> ${this.debugMode ? 'Active' : 'Inactive'}</div>
      <div><strong>Converted:</strong> ${stats.convertedElements}</div>
      <div><strong>Unknown:</strong> ${stats.unknownElements}</div>
    `;
  }

  collectStats() {
    return {
      convertedElements: document.querySelectorAll('.wingdings-converted').length,
      unknownElements: document.querySelectorAll('.wingdings-unknown').length
    };
  }

  runTests() {
    console.log('Running integration tests...');
    // ここに簡易的なテストスイートを実装
  }

  runBenchmarks() {
    console.log('Running benchmarks...');
    // ここにベンチマークを実装
  }

  clearCache() {
    console.log('Clearing caches...');
    // 各種キャッシュをクリア
  }

  exportDebugData() {
    console.log('Exporting debug data...');
    // デバッグ情報をJSONとしてエクスポート
  }
}