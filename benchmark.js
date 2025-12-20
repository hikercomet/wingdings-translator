#!/usr/bin/env node

/**
 * Performance Benchmark Script
 * 
 * This script benchmarks the performance improvements made to the Wingdings Translator.
 * Run with: node benchmark.js
 */

const { convertToRomaji } = require('./shared/romaji-converter.js');

// Benchmark configuration
const TEST_STRINGS = [
  'トウキョウ',
  'カタカナ',
  'ニホンゴ',
  'コンピューター',
  'プログラミング',
  'パフォーマンス',
  'ベンチマーク',
  'テスト'
];

const ITERATIONS = 10000;

function benchmark(name, fn) {
  console.log(`\n${name}:`);
  console.log('='.repeat(50));
  
  const start = Date.now();
  fn();
  const duration = Date.now() - start;
  
  console.log(`Total time: ${duration}ms`);
  console.log(`Average per iteration: ${(duration / ITERATIONS).toFixed(3)}ms`);
  console.log(`Throughput: ${(ITERATIONS / (duration / 1000)).toFixed(0)} ops/sec`);
}

function runBenchmarks() {
  console.log('\n' + '='.repeat(70));
  console.log('WINGDINGS TRANSLATOR - PERFORMANCE BENCHMARKS');
  console.log('='.repeat(70));

  // Benchmark 1: Single string repeated conversions (tests caching)
  benchmark('1. Repeated conversion of same string (cache effectiveness)', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      convertToRomaji('カタカナ');
    }
  });

  // Benchmark 2: Multiple different strings (tests general performance)
  benchmark('2. Conversion of varied strings', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      const str = TEST_STRINGS[i % TEST_STRINGS.length];
      convertToRomaji(str);
    }
  });

  // Benchmark 3: Long string conversion
  benchmark('3. Conversion of long strings', () => {
    const longString = 'カタカナヒラガナ'.repeat(10);
    for (let i = 0; i < ITERATIONS / 10; i++) {
      convertToRomaji(longString);
    }
  });

  // Benchmark 4: Mixed operations (realistic usage)
  benchmark('4. Mixed operations (realistic usage pattern)', () => {
    for (let i = 0; i < ITERATIONS; i++) {
      // Some repeated strings (should hit cache)
      if (i % 3 === 0) {
        convertToRomaji('トウキョウ');
      }
      // Some unique strings
      else {
        convertToRomaji(`テスト${i % 100}`);
      }
    }
  });

  console.log('\n' + '='.repeat(70));
  console.log('Benchmarks completed!');
  console.log('='.repeat(70) + '\n');
  
  // Performance tips
  console.log('Performance Tips:');
  console.log('- Cache is working if Benchmark #1 is significantly faster than #2');
  console.log('- All benchmarks should complete in < 1000ms on modern hardware');
  console.log('- Throughput should be > 1000 ops/sec for cached conversions');
  console.log('');
}

// Run benchmarks
try {
  runBenchmarks();
} catch (error) {
  console.error('Benchmark failed:', error);
  process.exit(1);
}
