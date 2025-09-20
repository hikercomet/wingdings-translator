# Wingdings Translator Tool

---

[English](#english) | [日本語 (Japanese)](#日本語-japanese)

---

## <a name="english"></a>English

### Overview

This Chrome extension converts Japanese and English text on web pages into the famous "Wingdings" font, and vice-versa. It provides a unique browsing experience, recreating the aesthetic of a certain well-known character using a computer.

It also includes a personal dictionary feature, allowing you to register custom words (such as proper nouns or technical terms) to improve conversion accuracy.

### Features

*   **Popup Translator**: Instantly convert snippets of text to and from Wingdings directly in the extension's popup.
*   **Full Page Conversion**: Convert all text on the current web page to Wingdings with a single click from the context menu or the popup. You can just as easily revert it back.
*   **Personal Dictionary**:
    *   Unrecognized words are highlighted in red during page conversion.
    *   Easily add new words by right-clicking the highlighted term and providing its reading.
    *   Manage your registered words (search, edit, delete) via the side panel.
*   **Character Map**: View a complete table of ASCII characters and their corresponding Wingdings symbols.
*   **English UI**: The user interface is provided in English.

### System Requirements
*   **Chrome**: Version 116 or later (for Side Panel API support).
*   **OS**: Windows, macOS, Linux (wherever Chrome is supported).
*   **Other Browsers**: Not officially tested, but may work on other Chromium-based browsers (e.g., Microsoft Edge).

### Installation (for Development)

1.  Clone this repository.
2.  Run `npm install` to install the necessary dependencies.
3.  Run `npm run build` to create the `dist` folder.
4.  Open Chrome and navigate to `chrome://extensions`.
5.  Enable "Developer mode".
6.  Click "Load unpacked" and select the `dist` folder from this project.

### How to Use

*   **For quick conversions:** Click the extension icon in the toolbar to use the popup translator.
*   **To convert a whole page:** Right-click on the page and select "Convert Entire Page to Wingdings", or use the button in the popup.
*   **To add a word:** When you see a red highlighted word after conversion, right-click it, select "Add to Dictionary", and enter its reading (in Hiragana) when prompted.

### FAQ

**Q: Some characters don't convert correctly.**
> A: The conversion primarily targets standard ASCII (A-Z, 0-9) and Japanese characters processed via morphological analysis. Some special symbols, emoji, or characters from other languages may not have a direct equivalent in the Wingdings font and will be left as is.

**Q: Will this make my browser slow?**
> A: The initial conversion of a very large page may take a few moments. However, the process is designed to run during browser idle time to minimize performance impact. Simple popup conversions and UI interactions are very fast.

**Q: How is my data privacy handled?**
> A: The personal dictionary is the only user data stored. It is saved using `chrome.storage.sync`, which securely syncs it to your own Google Account. This data is not transmitted to any external servers and is not accessible by the developers.

### License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

### Contributing

We welcome contributions! Please feel free to open an issue or submit a pull request.

#### Reporting Issues

When reporting a bug, please include the following details:
- A clear and descriptive title.
- Steps to reproduce the issue.
- What you expected to happen.
- What actually happened (including screenshots and any console errors).
- Your OS and Chrome version.

#### Pull Request Process

1.  Fork the repository.
2.  Create a new branch for your feature or fix (`git checkout -b feature/my-new-feature`).
3.  Make your changes.
4.  Commit your changes with a clear commit message.
5.  Push to your branch (`git push origin feature/my-new-feature`).
6.  Open a Pull Request.

#### Code Style

Please follow the existing code style and conventions. This project uses ESLint to enforce a consistent code style. Before committing, please ensure your code does not produce any linting errors.

---

## <a name="日本語-japanese"></a>日本語 (Japanese)

### 概要

このChrome拡張機能は、Webページ上の日本語や英語のテキストを、ミームとして有名な「Wingdings」フォントに変換したり、その逆を行ったりすることができます。特定のキャラクターがPCを使っているかのような、ユニークなブラウジング体験を提供します。

個人辞書機能を搭載しており、固有名詞などを登録することで、変換精度を向上させることも可能です。

### 主な機能

*   **ポップアップによる変換**: ポップアップ上で、任意のテキストとWingdingsフォント間の相互変換が可能です。
*   **ページ全体の変換**: 閲覧しているページ全体のテキストを一括でWingdingsに変換、または元に戻します。
*   **個人辞書**:
    *   変換できない単語（未知語）を右クリックで簡単に追加できます。
    *   サイドパネルから、登録した単語の検索、編集、削除が可能です。
*   **対応表**: Wingdingsフォントの文字と、対応するアルファベットの一覧を確認できます。
*   **英語UI**: ユーザーインターフェースは英語で提供されます。

### 動作要件
*   **Chrome**: バージョン 116 以降 (サイドパネルAPI対応のため)
*   **OS**: Windows, macOS, Linux (Chromeがサポートされている環境)
*   **その他のブラウザ**: 公式にはテストされていませんが、他のChromiumベースのブラウザ（例: Microsoft Edge）で動作する可能性があります。

### インストール方法（開発者向け）

1.  このリポジトリをクローンします。
2.  `npm install` を実行し、必要な依存関係をインストールします。
3.  `npm run build` を実行し、`dist`フォルダを作成します。
4.  Chromeで `chrome://extensions` を開きます。
5.  「デベロッパーモード」を有効にします。
6.  「パッケージ化されていない拡張機能を読み込む」をクリックし、このプロジェクトの`dist`フォルダを選択します。

### 使い方

*   **短いテキストの変換**: ツールバーの拡張機能アイコンをクリックし、ポップアップの翻訳機能を使用します。
*   **ページ全体の変換**: ページ上で右クリックし、「Convert Entire Page to Wingdings」を選択するか、ポップアップ内のボタンを使用します。
*   **単語の追加**: 変換後に赤くハイライトされた単語を右クリックし、「Add to Dictionary」を選択、プロンプトにひらがなで読みを入力します。

### FAQ（よくある質問）

**Q: 変換できない文字があるのですが？**
> A: この変換は、主に標準的なASCII文字（A-Z, 0-9）と、形態素解析された日本語を対象としています。一部の特殊記号、絵文字、その他の言語の文字には、対応するWingdingsの記号が存在しない場合があり、その場合はそのまま表示されます。

**Q: ページの表示が重くなりませんか？**
> A: 非常に大きなページの初回変換には、少し時間がかかる場合があります。しかし、処理はブラウザのアイドル時間に行われるよう設計されており、パフォーマンスへの影響を最小限に抑えています。ポップアップでの変換やUIの操作は高速です。

**Q: データプライバシーはどのように扱われますか？**
> A: 保存されるユーザーデータは個人辞書のみです。データは`chrome.storage.sync`を用いて、あなた自身のGoogleアカウントに安全に同期されます。このデータが外部のサーバーに送信されたり、開発者がアクセスしたりすることはありません。

### ライセンス

このプロジェクトは **MIT License** の下で公開されています。詳細は [LICENSE](LICENSE) ファイルをご覧ください。

### コントリビュート（貢献）

このプロジェクトへの貢献を歓迎します！Issueの報告やプルリクエストを、お気軽に行ってください。

#### Issueの報告

バグを報告する際は、以下の内容を含めてください：
- 明確で分かりやすいタイトル
- 問題を再現するための具体的な手順
- 期待される動作
- 実際に起きた動作（スクリーンショットやコンソールエラーを含む）
- あなたのOSとChromeのバージョン

#### Pull Requestのプロセス

1.  このリポジトリをフォークします。
2.  機能追加またはバグ修正のための新しいブランチを作成します (`git checkout -b feature/my-new-feature`)。
3.  変更を加えます。
4.  分かりやすいコミットメッセージと共に変更をコミットします。
5.  あなたのブランチにプッシュします (`git push origin feature/my-new-feature`)。
6.  プルリクエストを作成します。

#### コードスタイル

既存のコードスタイルと規約に従ってください。このプロジェクトはESLintを使用して、一貫したコードスタイルを強制しています。コミットする前に、あなたのコードがリンターのエラーを一切出さないことを確認してください。
