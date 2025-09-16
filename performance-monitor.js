// performance-monitor.js
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      conversions: [],
      memoryUsage: [],
      errors: []
    };
    this.isMonitoring = false;
  }

  startMonitoring() {
    this.isMonitoring = true;
    this.monitorMemory();
    this.setupErrorTracking();
  }

  stopMonitoring() {
    this.isMonitoring = false;
  }

  recordConversion(startTime, endTime, textLength, success) {
    const duration = endTime - startTime;
    const throughput = textLength / (duration / 1000); // 文字/秒
    
    this.metrics.conversions.push({
      timestamp: Date.now(),
      duration,
      textLength,
      throughput,
      success
    });

    // パフォーマンス劣化の検出
    if (duration > 5000) { // 5秒以上
      console.warn('Slow conversion detected:', {
        duration,
        textLength,
        throughput
      });
      
      this.reportSlowConversion(duration, textLength);
    }
  }

  monitorMemory() {
    if (!this.isMonitoring) return;

    if (performance.memory) {
      this.metrics.memoryUsage.push({
        timestamp: Date.now(),
        usedJSHeapSize: performance.memory.usedJSHeapSize,
        totalJSHeapSize: performance.memory.totalJSHeapSize,
        jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
      });

      // メモリリークの検出
      if (this.metrics.memoryUsage.length > 10) {
        const recent = this.metrics.memoryUsage.slice(-10);
        const trend = this.calculateMemoryTrend(recent);
        
        if (trend > 1024 * 1024) { // 1MB/分以上の増加
          console.warn('Potential memory leak detected:', trend);
          this.reportMemoryLeak(trend);
        }
      }
    }

    setTimeout(() => this.monitorMemory(), 60000); // 1分間隔
  }

  calculateMemoryTrend(data) {
    if (data.length < 2) return 0;
    
    const first = data[0];
    const last = data[data.length - 1];
    const timeDiff = (last.timestamp - first.timestamp) / 60000; // 分
    const memoryDiff = last.usedJSHeapSize - first.usedJSHeapSize;
    
    return memoryDiff / timeDiff; // バイト/分
  }

  setupErrorTracking() {
    window.addEventListener('error', (event) => {
      this.recordError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
    });

    window.addEventListener('unhandledrejection', (event) => {
      this.recordError({
        type: 'promise',
        message: event.reason?.message || event.reason,
        stack: event.reason?.stack
      });
    });
  }

  recordError(error) {
    this.metrics.errors.push({
      timestamp: Date.now(),
      ...error
    });

    // エラー率の監視
    const recentErrors = this.metrics.errors.filter(
      e => Date.now() - e.timestamp < 300000 // 5分以内
    );
    
    if (recentErrors.length > 10) {
      console.error('High error rate detected:', recentErrors.length);
      this.reportHighErrorRate(recentErrors);
    }
  }

  reportSlowConversion(duration, textLength) {
    chrome.runtime.sendMessage({
      type: 'PERFORMANCE_ALERT',
      alert: 'slow_conversion',
      data: { duration, textLength }
    });
  }

  reportMemoryLeak(trend) {
    chrome.runtime.sendMessage({
      type: 'PERFORMANCE_ALERT',
      alert: 'memory_leak',
      data: { trend }
    });
  }

  reportHighErrorRate(errors) {
    chrome.runtime.sendMessage({
      type: 'PERFORMANCE_ALERT',
      alert: 'high_error_rate',
      data: { errorCount: errors.length }
    });
  }

  generateReport() {
    const now = Date.now();
    const last24h = now - 24 * 60 * 60 * 1000;

    const recentConversions = this.metrics.conversions.filter(
      c => c.timestamp > last24h
    );

    const recentMemory = this.metrics.memoryUsage.filter(
      m => m.timestamp > last24h
    );

    const recentErrors = this.metrics.errors.filter(
      e => e.timestamp > last24h
    );

    return {
      summary: {
        conversions: recentConversions.length,
        successRate: recentConversions.filter(c => c.success).length / recentConversions.length,
        avgDuration: recentConversions.reduce((sum, c) => sum + c.duration, 0) / recentConversions.length,
        avgThroughput: recentConversions.reduce((sum, c) => sum + c.throughput, 0) / recentConversions.length,
        errorCount: recentErrors.length,
        memoryTrend: this.calculateMemoryTrend(recentMemory)
      },
      details: {
        conversions: recentConversions,
        memory: recentMemory,
        errors: recentErrors
      }
    };
  }
}

// グローバル監視インスタンス
const performanceMonitor = new PerformanceMonitor();
performanceMonitor.startMonitoring();