import { test, expect, chromium, type BrowserContext, type Page } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pathToExtension = path.join(__dirname, '../dist');

let context: BrowserContext;

test.beforeAll(async () => {
  context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${pathToExtension}`,
      `--load-extension=${pathToExtension}`,
    ],
  });
});

test.afterAll(async () => {
  await context.close();
});

test.describe('Extension basic functionality', () => {
  test('should load the extension and its side panel content', async () => {
    // --- THE FIX ---
    // Get the service worker to find the extension's unique ID
    let serviceWorker = context.serviceWorkers()[0];
    if (!serviceWorker) {
      serviceWorker = await context.waitForEvent('serviceworker');
    }
    const extensionId = serviceWorker.url().split('/')[2];
    expect(extensionId, "The extension ID should be valid.").toBeTruthy();

    // Construct the direct URL to the side panel's HTML page
    const sidePanelUrl = `chrome-extension://${extensionId}/index.html`;

    // Navigate to the side panel's URL in a new page
    const sidePanelPage = await context.newPage();
    await sidePanelPage.goto(sidePanelUrl);

    // Assert that the title is visible in the side panel
    const title = sidePanelPage.locator('h1:has-text("HootSpot")');
    await expect(title, "The main title 'HootSpot' should be visible.").toBeVisible();
  });
});