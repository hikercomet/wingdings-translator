/**
 * @jest-environment node
 */
const puppeteer = require('puppeteer');
const path = require('path');

describe('Wingdings Extension E2E Tests', () => {
  jest.setTimeout(60000);
  let browser;
  let page;
  let extensionId;

  beforeAll(async () => {
    const pathToExtension = path.resolve(__dirname, '../dist');
    browser = await puppeteer.launch({
      headless: false,
      args: [
        `--disable-extensions-except=${pathToExtension}`,
        `--load-extension=${pathToExtension}`,
      ],
    });

    // Wait for the service worker to be ready and get its URL to derive the extension ID
    const extensionTarget = await browser.waitForTarget(
      (target) => target.type() === 'service_worker',
      { timeout: 10000 } // Wait up to 10 seconds
    );

    if (!extensionTarget) {
      throw new Error("Extension service worker did not appear");
    }

    const partialExtensionUrl = extensionTarget.url() || '';
    const [, , id] = partialExtensionUrl.split('/');
    extensionId = id;

    page = await browser.newPage();
  });

  afterAll(async () => {
    if (browser) {
      await browser.close();
    }
  });

  test('should load the extension and find its ID', () => {
    expect(extensionId).toBeTruthy();
  });

  test('popup should open and have a title', async () => {
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    const title = await page.$eval('h1', el => el.textContent);
    expect(title).toContain('Wingdings変換ツール');
  });

  test('popup input and convert button should work', async () => {
    await page.goto(`chrome-extension://${extensionId}/popup.html`);
    await page.type('#inputText', 'Hello');
    await page.click('#convertBtn');
    await page.waitForSelector('#resultText', { visible: true });
    const resultText = await page.$eval('#resultText', el => el.textContent);
    expect(resultText).not.toBe('Hello');
  });
});
