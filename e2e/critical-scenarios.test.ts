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
    // UPDATED: Mock for invalid Google API key
    if (url.includes('v1beta/models?key=invalid-api-key')) {
        return route.fulfill({ status: 400, contentType: 'application/json', body: JSON.stringify({
            error: { message: 'API key not valid. Please pass a valid API Key.' }
        })});
    }
    // Existing mock for valid key
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
  await sidePanelPage.goto(sidePanelUrl, { waitUntil: 'domcontentloaded' });
  await sidePanelPage.evaluate(() => localStorage.clear());
  await sidePanelPage.reload();
  await expect(sidePanelPage.locator('h1:has-text("HootSpot")')).toBeVisible();
});

test.afterEach(async () => { await sidePanelPage.close(); });

test.describe('Critical E2E Scenarios', () => {

  test('Test Case 1: should allow first-time configuration with Google API and perform an analysis', async () => {
    const apiKeyInput = sidePanelPage.getByLabel('API Key');
    await expect(apiKeyInput).toBeVisible();
    const saveButton = sidePanelPage.getByRole('button', { name: /save & test configuration/i });
    await expect(saveButton).toBeDisabled();
    await apiKeyInput.fill('mock-api-key');
    await expect(saveButton).toBeEnabled();
    await saveButton.click();
    await expect(apiKeyInput).not.toBeVisible({ timeout: 10000 });
    await expect(sidePanelPage.getByText('Configuration is configured.')).toBeVisible();
    const analysisTextarea = sidePanelPage.getByPlaceholder(/enter text to analyze/i);
    await analysisTextarea.fill('This is some text for analysis.');
    const analyzeButton = sidePanelPage.getByRole('button', { name: 'Analyze' });
    await expect(analyzeButton).toBeEnabled();
    await analyzeButton.click();
    await expect(sidePanelPage.getByRole('heading', { name: 'Analysis Report', level: 2 })).toBeVisible({ timeout: 20000 });
    await expect(sidePanelPage.getByText('This is a mock summary from the Google API.')).toBeVisible();
    await expect(sidePanelPage.getByRole('heading', { name: 'Mockery', level: 4 })).toBeVisible();
  });

  test('Test Case 2: should analyze text from a webpage after configuration', async () => {
    const apiKeyInput = sidePanelPage.getByLabel('API Key');
    const saveButton = sidePanelPage.getByRole('button', { name: /save & test configuration/i });
    await apiKeyInput.fill('mock-api-key');
    await saveButton.click();
    await expect(apiKeyInput).not.toBeVisible({ timeout: 10000 });
    await expect(sidePanelPage.getByText('Configuration is configured.')).toBeVisible();
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
    expect(selectedText).not.toBe('');
    const background = context.serviceWorkers()[0];
    await background.evaluate(async (text) => {
        const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        if(tab && tab.windowId) {
            await chrome.sidePanel.open({ windowId: tab.windowId });
            await chrome.runtime.sendMessage({ type: 'PUSH_TEXT_TO_PANEL', text, autoAnalyze: true });
        }
    }, selectedText);
    await expect(sidePanelPage.getByRole('heading', { name: 'Analysis Report', level: 2 })).toBeVisible({ timeout: 20000 });
    await expect(sidePanelPage.getByText('This is a mock summary from the Google API.')).toBeVisible();
    await expect(sidePanelPage.getByRole('heading', { name: 'Mockery', level: 4 })).toBeVisible();
    await page.close();
  });

  test('Test Case 3: should trigger download for PDF and JSON reports', async () => {
    const apiKeyInput = sidePanelPage.getByLabel('API Key');
    const saveButton = sidePanelPage.getByRole('button', { name: /save & test configuration/i });
    await apiKeyInput.fill('mock-api-key');
    await saveButton.click();
    await expect(apiKeyInput).not.toBeVisible({ timeout: 10000 });
    await expect(sidePanelPage.getByText('Configuration is configured.')).toBeVisible();
    const analysisTextarea = sidePanelPage.getByPlaceholder(/enter text to analyze/i);
    await analysisTextarea.fill('Text for report download test.');
    await sidePanelPage.getByRole('button', { name: 'Analyze' }).click();
    await expect(sidePanelPage.getByRole('heading', { name: 'Analysis Report', level: 2 })).toBeVisible({timeout: 20000});
    const shareButton = sidePanelPage.getByRole('button', { name: /share or download report/i });
    await shareButton.click();
    const [jsonDownload] = await Promise.all([
        sidePanelPage.waitForEvent('download'),
        sidePanelPage.getByRole('button', { name: 'Download JSON' }).click(),
    ]);
    expect(jsonDownload.suggestedFilename()).toContain('.json');
    await shareButton.click();
    const [pdfDownload] = await Promise.all([
        sidePanelPage.waitForEvent('download', { timeout: 15000 }),
        sidePanelPage.getByRole('button', { name: 'Download PDF' }).click(),
    ]);
    expect(pdfDownload.suggestedFilename()).toContain('.pdf');
  });

  test('Test Case 4: should allow configuration and analysis with LM Studio', async () => {
    await sidePanelPage.getByRole('button', { name: /local/i }).click();
    const urlInput = sidePanelPage.getByLabel(/local server url/i);
    const modelInput = sidePanelPage.getByLabel(/local model name/i);
    await urlInput.fill('http://localhost:1234');
    await modelInput.fill('mock-model-name');
    const saveButton = sidePanelPage.getByRole('button', { name: /save & test configuration/i });
    await expect(saveButton).toBeEnabled();
    await saveButton.click();
    await expect(urlInput).not.toBeVisible({ timeout: 10000 });
    await expect(sidePanelPage.getByText('Configuration is configured.')).toBeVisible();
    const analysisTextarea = sidePanelPage.getByPlaceholder(/enter text to analyze/i);
    await analysisTextarea.fill('This is text for LM Studio');
    const analyzeButton = sidePanelPage.getByRole('button', { name: 'Analyze' });
    await expect(analyzeButton).toBeEnabled();
    await analyzeButton.click();
    await expect(sidePanelPage.getByRole('heading', { name: 'Analysis Report', level: 2 })).toBeVisible({ timeout: 20000 });
    await expect(sidePanelPage.getByText('This is a mock summary from LM Studio.')).toBeVisible();
    await expect(sidePanelPage.getByRole('heading', { name: 'Local Mock', level: 4 })).toBeVisible();
  });

  test('Test Case 5: should handle invalid API key input correctly', async () => {
    const apiKeyInput = sidePanelPage.getByLabel('API Key');
    await expect(apiKeyInput).toBeVisible();
    const saveButton = sidePanelPage.getByRole('button', { name: /save & test configuration/i });
    await expect(saveButton).toBeDisabled();
    const addLangButton = sidePanelPage.getByRole('button', { name: /add & translate language/i });
    await expect(addLangButton).toBeVisible();
    await expect(addLangButton).toBeDisabled();
    await apiKeyInput.fill('invalid-api-key');
    await expect(sidePanelPage.getByText('Error loading models.')).toBeVisible();
    await expect(sidePanelPage.getByText('API key not valid. Please pass a valid API Key.')).toBeVisible();
    await expect(saveButton).toBeDisabled();
    await expect(addLangButton).toBeDisabled();
    await apiKeyInput.fill('');
    await expect(sidePanelPage.getByText('Error loading models.')).not.toBeVisible();
    await expect(sidePanelPage.getByText('API key not valid. Please pass a valid API Key.')).not.toBeVisible();
    await expect(sidePanelPage.getByText('Enter API Key to see models')).toBeVisible();
    await expect(saveButton).toBeDisabled();
  });
});