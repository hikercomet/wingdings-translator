# Lightweight Investigation

## Scope and approach
- Reviewed the current extension architecture (`manifest.json`, `webpack.config.js`, `content/*`, `background/*`).
- Measured production bundle output with `npm run build`.
- Looked for low-risk reductions in runtime overhead and bundle weight without changing user-facing behavior.

## Current build snapshot
From `npm run build`:
- `content/content-script.js`: **141 KiB** (largest artifact).
- `background/service-worker.js`: 10.8 KiB.
- `popup/popup.js`: 9.18 KiB.
- Most code volume comes from `kuromoji` and related dependencies bundled into the content script.

## What can be slimmed down

### 1) Remove high-volume debug logging in the hot path (implemented)
- `TextConverter.loadUserDictionary()` printed full dictionary payloads and per-entry debug lines.
- `TextConverter.convert()` printed untokenized fragments.
- `init()` logged tokenizer success on every initialization.

Why this helps:
- Avoids unnecessary string formatting and console I/O during conversion.
- Slightly reduces minified output size.
- Low risk because conversion logic is unchanged.

### 2) Keep Kuromoji loading as late as possible (already partially done)
- The code already lazy-builds the reverse Wingdings map and performs dictionary refresh before conversion.
- Implemented: tokenization is now skipped when the input has no Japanese text, and pure ASCII/Latin input is passed through direct conversion.

Why this helps:
- Avoids expensive tokenization work on ASCII-only pages/snippets.

### 3) Structural optimization: thin bootstrap + lazy runtime initialization (implemented)
- Content script startup now only sets listeners; converter and DOM manipulator modules are required only when conversion-related messages arrive.
- Kuromoji/dictionary-heavy runtime is moved off the initial content script startup path.

Why this helps:
- Reduces startup cost of content script execution on every page.
- Best impact potential, but requires more testing to avoid extension lifecycle regressions.

## Recommendation order (practical)
1. Keep the logging cleanup (done).
2. Add fast-path bypass for non-Japanese text. (implemented)
3. Keep the thin bootstrap + lazy runtime initialization pattern.
