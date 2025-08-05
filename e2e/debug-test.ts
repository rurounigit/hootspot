import { test, expect, chromium, type BrowserContext, type Page } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';

// --- Test Setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pathToExtension = path.join(__dirname, '../dist');

let context: BrowserContext;
let sidePanelPage: Page;

test.beforeAll(async () => {
  context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [`--disable-extensions-except=${pathToExtension}`, `--load-extension=${pathToExtension}`],
  });

  // Network mocking
  await context.route('**/*', async (route) => {
    const url = route.request().url();

    // Mock Google API calls
    if (url.includes('googleapis.com')) {
      // Model listing
      if (url.includes('v1beta/models')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
            models: [{ name: 'models/gemini-1.5-pro-latest', displayName: 'Gemini 1.5 Pro', supportedGenerationMethods: ['generateContent'] }]
        })});
      }
    }

    return route.continue();
  });
});

test.afterAll(async () => { await context.close(); });

test.beforeEach(async () => {
  const serviceWorker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
  const extensionId = serviceWorker.url().split('/')[2];
  sidePanelPage = await context.newPage();
  await sidePanelPage.goto(`chrome-extension://${extensionId}/index.html`, { waitUntil: 'domcontentloaded' });
  await sidePanelPage.evaluate(() => localStorage.clear());
  await sidePanelPage.reload();
  await expect(sidePanelPage.locator('h1:has-text("HootSpot")')).toBeVisible();
});

test.afterEach(async () => { await sidePanelPage.close(); });

test('Debug: Check configuration success message', async () => {
  // Configure Google API provider
  const apiKeyInput = sidePanelPage.getByLabel('Google Gemini API Key');
  await apiKeyInput.fill('mock-api-key');

  await sidePanelPage.waitForTimeout(2000);

  const saveButton = sidePanelPage.locator('button[aria-label="save-and-test-configuration"]');
  await expect(saveButton).toBeEnabled({ timeout: 10000 });
  await saveButton.click();

  // Wait a bit and then check what text is actually visible
  await sidePanelPage.waitForTimeout(2000);

  // Try to find any text that indicates success
  const allText = await sidePanelPage.locator('body').textContent();
  console.log('All visible text:', allText);

  // Try different possible success messages
  try {
    await expect(sidePanelPage.getByText(/Google provider is configured and ready/i)).toBeVisible({ timeout: 5000 });
    console.log('Found: Google provider is configured and ready');
  } catch (e) {
    console.log('Not found: Google provider is configured and ready');
  }

  try {
    await expect(sidePanelPage.getByText(/Google API provider is configured/i)).toBeVisible({ timeout: 5000 });
    console.log('Found: Google API provider is configured');
  } catch (e) {
    console.log('Not found: Google API provider is configured');
  }

  try {
    await expect(sidePanelPage.getByText(/configured/i)).toBeVisible({ timeout: 5000 });
    console.log('Found some text with "configured"');
  } catch (e) {
    console.log('Not found: any text with "configured"');
  }
});
