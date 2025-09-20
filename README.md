# Wingdings Translator Tool

---

[English](#english) | [日本語 (Japanese)](#日本語-japanese) | [Español (Spanish)](#español-spanish)

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

---

## <a name="español-spanish"></a>Español (Spanish)

### Resumen

Esta extensión de Chrome convierte texto en japonés e inglés en las páginas web a la famosa fuente "Wingdings" y viceversa. Proporciona una experiencia de navegación única, recreando la estética de cierto personaje conocido usando una computadora.

También incluye una función de diccionario personal, que le permite registrar palabras personalizadas (como nombres propios o términos técnicos) para mejorar la precisión de la conversión.

### Características

*   **Traductor Emergente**: Convierta instantáneamente fragmentos de texto desde y hacia Wingdings directamente en la ventana emergente de la extensión.
*   **Conversión de Página Completa**: Convierta todo el texto de la página web actual a Wingdings con un solo clic desde el menú contextual o la ventana emergente. Puede revertirlo con la misma facilidad.
*   **Diccionario Personal**:
    *   Las palabras no reconocidas se resaltan en rojo durante la conversión de la página.
    *   Agregue fácilmente nuevas palabras haciendo clic derecho en el término resaltado y proporcionando su lectura.
    *   Administre sus palabras registradas (buscar, editar, eliminar) a través del panel lateral.
*   **Tabla de Caracteres**: Vea una tabla completa de caracteres ASCII y sus símbolos Wingdings correspondientes.
*   **Interfaz en Inglés**: La interfaz de usuario se proporciona en inglés.

### Instalación (para Desarrollo)

1.  Clone este repositorio.
2.  Ejecute `npm install` para instalar las dependencias necesarias.
3.  Ejecute `npm run build` para crear la carpeta `dist`.
4.  Abra Chrome y navegue a `chrome://extensions`.
5.  Habilite el "Modo de desarrollador".
6.  Haga clic en "Cargar descomprimida" y seleccione la carpeta `dist` de este proyecto.

### Cómo Usar

*   **Para conversiones rápidas:** Haga clic en el ícono de la extensión en la barra de herramientas para usar el traductor emergente.
*   **Para convertir una página completa:** Haga clic derecho en la página y seleccione "Convert Entire Page to Wingdings", o use el botón en la ventana emergente.
*   **Para agregar una palabra:** Cuando vea una palabra resaltada en rojo después de la conversión, haga clic derecho sobre ella, seleccione "Add to Dictionary" e ingrese su lectura (en Hiragana) cuando se le solicite.