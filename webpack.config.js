const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  mode: 'development',
  devtool: 'cheap-module-source-map',
  entry: {
    // Bundle all content scripts together
    'content/content-script': [
      './node_modules/kuromoji/build/kuromoji.js',
      './content/converter.js',
      './content/dom-manipulator.js',
      './content/content-script.js'
    ],
    'background/service-worker': './background/service-worker.js',
    'popup/popup': './popup/popup.js',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
  },
  resolve: {
    extensions: ['.js'],
    fallback: {
      "path": require.resolve("path-browserify")
    }
  },
  module: {
    rules: [],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'manifest.json', to: 'manifest.json' },
        { from: 'popup/popup.html', to: 'popup/popup.html' },
        { from: 'popup/popup.css', to: 'popup/popup.css' },
        { from: 'assets', to: 'assets' },
        { from: 'data', to: 'data' },
        { from: 'sidepanel', to: 'sidepanel' },
        // Copy kuromoji dictionary files
        { from: 'node_modules/kuromoji/dict', to: 'data/dict' },
      ],
    }),
  ],
};