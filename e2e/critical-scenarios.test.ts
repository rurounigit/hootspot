import { test, expect, chromium, type BrowserContext, type Page } from '@playwright/test';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pathToExtension = path.join(__dirname, '../dist');
const testPageUrl = 'https://www.theatlantic.com/ideas/archive/2022/10/liz-truss-ideology-conservatism-thatcher/671633/';

let context: BrowserContext;
let sidePanelPage: Page;

test.beforeAll(async () => {
  context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [`--disable-extensions-except=${pathToExtension}`, `--load-extension=${pathToExtension}`],
    viewport: { width: 1280, height: 720 }
  });

  await context.route('**/*', async (route, request) => {
    const url = request.url();
    if (url.includes('v1beta/models?key=')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
            models: [{ name: 'models/gemini-1.5-pro-latest', displayName: 'Gemini 1.5 Pro', supportedGenerationMethods: ['generateContent'], version: '1.0' }]
        })});
    }
    if (url.includes('googleapis.com') && request.method() === 'POST') {
        const postData = request.postDataJSON();
        if (postData.system) { // Analysis call
            return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
                candidates: [{ content: { parts: [{ text: "```json\n{\"analysis_summary\": \"This is a mock summary from the Google API.\", \"findings\": [{\"pattern_name\": \"Mock Pattern\", \"display_name\": \"Mockery\", \"specific_quote\": \"some text for analysis\", \"explanation\": \"This is a mock explanation.\", \"strength\": 7, \"category\": \"category_sociopolitical_rhetorical\"}]}\n```" }] } }]
            })});
        }
    }
    if (url.includes('localhost:1234')) {
        const postData = request.postDataJSON();
        if (postData.messages[0].content === 'Hello') {
            return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ choices: [{ message: { content: 'Hello from mock server' } }] }) });
        } else {
            return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
                choices: [{ message: { content: '```json\n{\"analysis_summary\": \"This is a mock summary from LM Studio.\", \"findings\": [{\"pattern_name\": \"Local Pattern\", \"display_name\": \"Local Mock\", \"specific_quote\": \"text for LM Studio\", \"explanation\": \"Mock explanation from local model.\", \"strength\": 5, \"category\": \"category_interpersonal_psychological\"}]}\n```' } }]
            })});
        }
    }
    return route.continue();
  });
});

test.afterAll(async () => { await context.close(); });

test.beforeEach(async () => {
  let serviceWorker = context.serviceWorkers()[0] || await context.waitForEvent('serviceworker');
  const extensionId = serviceWorker.url().split('/')[2];
  const sidePanelUrl = `chrome-extension://${extensionId}/index.html`;

  sidePanelPage = await context.newPage();
  await sidePanelPage.goto(sidePanelUrl);
  await sidePanelPage.evaluate(() => localStorage.clear());
  await sidePanelPage.reload();
  await expect(sidePanelPage.locator('h1:has-text("HootSpot")')).toBeVisible();
});

test.afterEach(async () => { await sidePanelPage.close(); });

test.describe('Critical E2E Scenarios', () => {

  test('Test Case 1: should allow first-time configuration with Google API and perform an analysis', async () => {
    await expect(sidePanelPage.locator('input#apiKey')).toBeVisible();
    await expect(sidePanelPage.getByText("Please complete your configuration in the settings above to enable analysis.")).toBeVisible();

    await sidePanelPage.locator('input#apiKey').fill('mock-api-key');
    await sidePanelPage.locator('button:has-text("Save & Test")').click();

    await expect(sidePanelPage.getByText('API Key saved and validated successfully!')).toBeVisible({ timeout: 10000 });
    await expect(sidePanelPage.locator('p:has-text("Configuration is set")')).toBeVisible();

    await sidePanelPage.locator('textarea').fill('This is some text for analysis.');
    await sidePanelPage.locator('button:has-text("Analyze")').click();

    await expect(sidePanelPage.locator('h2:has-text("Analysis Report")')).toBeVisible({ timeout: 20000 });
    await expect(sidePanelPage.getByText('This is a mock summary from the Google API.')).toBeVisible();
    await expect(sidePanelPage.locator('h4:has-text("Mockery")')).toBeVisible();
  });

  test('Test Case 2: should analyze text from a webpage via keyboard shortcut', async () => {
    await sidePanelPage.locator('input#apiKey').fill('mock-api-key');
    await sidePanelPage.locator('button:has-text("Save & Test")').click();
    await expect(sidePanelPage.getByText('API Key saved and validated successfully!')).toBeVisible();

    const page = await context.newPage();
    await page.goto(testPageUrl, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1').first()).toBeVisible();

    const selectedText = await page.evaluate(() => {
        const p = document.querySelector('article p');
        if (p) {
            window.getSelection()?.getRangeAt(0).selectNodeContents(p);
            return window.getSelection()?.toString();
        }
        return '';
    });

    const background = context.serviceWorkers()[0];
    await background.evaluate(async (text) => {
        const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        if(tab && tab.windowId) {
            await chrome.sidePanel.open({ windowId: tab.windowId });
            await chrome.runtime.sendMessage({ type: 'PUSH_TEXT_TO_PANEL', text, autoAnalyze: true });
        }
    }, selectedText);

    await expect(sidePanelPage.locator('h2:has-text("Analysis Report")')).toBeVisible({ timeout: 20000 });
    await expect(sidePanelPage.getByText('This is a mock summary from the Google API.')).toBeVisible();
    await page.close();
  });

  test('Test Case 3: should trigger download for PDF and JSON reports', async () => {
    await sidePanelPage.locator('input#apiKey').fill('mock-api-key');
    await sidePanelPage.locator('button:has-text("Save & Test")').click();
    await expect(sidePanelPage.getByText('API Key saved and validated successfully!')).toBeVisible();
    await sidePanelPage.locator('textarea').fill('Text for report download test.');
    await sidePanelPage.locator('button:has-text("Analyze")').click();
    await expect(sidePanelPage.locator('h2:has-text("Analysis Report")')).toBeVisible({timeout: 20000});

    await sidePanelPage.locator('button[aria-label="Share or Download Report"]').click();
    const [jsonDownload] = await Promise.all([
        sidePanelPage.waitForEvent('download'),
        sidePanelPage.locator('button:has-text("Download JSON")').click(),
    ]);
    expect(jsonDownload.suggestedFilename()).toContain('.json');

    await sidePanelPage.locator('button[aria-label="Share or Download Report"]').click();
    const [pdfDownload] = await Promise.all([
        sidePanelPage.waitForEvent('download', { timeout: 15000 }),
        sidePanelPage.locator('button:has-text("Download PDF")').click(),
    ]);
    expect(pdfDownload.suggestedFilename()).toContain('.pdf');
  });

  test('Test Case 4: should allow configuration and analysis with LM Studio', async () => {
    await sidePanelPage.locator('button:has-text("LM Studio (Local)")').click();
    await sidePanelPage.locator('input#lmStudioUrl').fill('http://localhost:1234');
    await sidePanelPage.locator('input#lmStudioModel').fill('mock-model-name');
    await sidePanelPage.locator('button:has-text("Save & Test")').click();

    await expect(sidePanelPage.getByText('Successfully connected to LM Studio server!')).toBeVisible({timeout: 10000});
    await expect(sidePanelPage.locator('p:has-text("Configuration is set")')).toBeVisible();

    await sidePanelPage.locator('textarea').fill('This is text for LM Studio');
    await sidePanelPage.locator('button:has-text("Analyze")').click();

    await expect(sidePanelPage.locator('h2:has-text("Analysis Report")')).toBeVisible({ timeout: 20000 });
    await expect(sidePanelPage.getByText('This is a mock summary from LM Studio.')).toBeVisible();
    await expect(sidePanelPage.locator('h4:has-text("Local Mock")')).toBeVisible();
  });
});