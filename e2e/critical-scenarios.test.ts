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
    // 1. Initial State: Assert that the configuration form is visible.
    // The input is linked to a label "API Key". We use getByLabel to find it like a user would.
    // Using a case-insensitive regular expression makes the test more robust.
    const apiKeyInput = sidePanelPage.getByLabel('API Key');
    await expect(apiKeyInput).toBeVisible();

    // The "Save & Test" button has a specific aria-label which is the most stable selector.
    // We target it directly. It should be disabled initially because the input is empty.
    const saveButton = sidePanelPage.getByRole('button', { name: /save & test configuration/i });
    await expect(saveButton).toBeDisabled();

    // 2. User Action: Fill the API key and click the save button.
    await apiKeyInput.fill('mock-api-key');

    // After filling the input, the button becomes enabled.
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    // 3. Success State: Assert that the configuration form collapses and the analysis UI is ready.
    // The most reliable check for collapse is that the API key input is no longer visible.
    await expect(apiKeyInput).not.toBeVisible({ timeout: 10000 });

    // The component shows a success message when collapsed and configured.
    // The text 'config_is_configured' is translated to "Configuration is configured."
    await expect(sidePanelPage.getByText('Configuration is configured.')).toBeVisible();

    // 4. Perform Analysis: Fill the textarea and click analyze.
    // The textarea is best found by its placeholder text, defined by the 'analyzer_placeholder' key.
    const analysisTextarea = sidePanelPage.getByPlaceholder(/enter text to analyze/i);
    await analysisTextarea.fill('This is some text for analysis.');

    // The analyze button's text comes from the 'analyzer_button_analyze' i18n key.
    const analyzeButton = sidePanelPage.getByRole('button', { name: 'Analyze' });
    await expect(analyzeButton).toBeEnabled(); // Should now be enabled.
    await analyzeButton.click();

    // 5. Report Assertions: Verify the analysis report content using accessible roles.
    await expect(sidePanelPage.getByRole('heading', { name: 'Analysis Report', level: 2 })).toBeVisible({ timeout: 20000 });
    await expect(sidePanelPage.getByText('This is a mock summary from the Google API.')).toBeVisible();
    await expect(sidePanelPage.getByRole('heading', { name: 'Mockery', level: 4 })).toBeVisible();
  });

  test('Test Case 2: should analyze text from a webpage after configuration', async () => {
    // 1. Configuration: Use the same robust locators as in Test Case 1 to configure the extension.
    const apiKeyInput = sidePanelPage.getByLabel('API Key');
    const saveButton = sidePanelPage.getByRole('button', { name: /save & test configuration/i });

    await apiKeyInput.fill('mock-api-key');
    await saveButton.click();

    // Assert that the configuration has been successfully saved and the panel has collapsed.
    await expect(apiKeyInput).not.toBeVisible({ timeout: 10000 });
    await expect(sidePanelPage.getByText('Configuration is configured.')).toBeVisible();

    // 2. Web Page Interaction: Open a new page and select text. This logic remains the same.
    const page = await context.newPage();
    await page.goto(testPageUrl, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('h1').first()).toBeVisible();

    const selectedText = await page.evaluate(() => {
        // Find the first paragraph in the article body for selection
        const p = document.querySelector('article p');
        if (p) {
            window.getSelection()?.getRangeAt(0).selectNodeContents(p);
            return window.getSelection()?.toString();
        }
        return '';
    });

    // Ensure that text was actually selected.
    expect(selectedText).not.toBe('');

    // 3. Trigger Analysis: Simulate the service worker pushing the selected text to the side panel for auto-analysis.
    const background = context.serviceWorkers()[0];
    await background.evaluate(async (text) => {
        // This code runs in the service worker's context
        const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
        if(tab && tab.windowId) {
            // This mimics the action of a context menu click or keyboard shortcut
            await chrome.sidePanel.open({ windowId: tab.windowId });
            await chrome.runtime.sendMessage({ type: 'PUSH_TEXT_TO_PANEL', text, autoAnalyze: true });
        }
    }, selectedText);

    // 4. Assertions: Verify the analysis report appears in the side panel with the correct content.
    await expect(sidePanelPage.getByRole('heading', { name: 'Analysis Report', level: 2 })).toBeVisible({ timeout: 20000 });
    await expect(sidePanelPage.getByText('This is a mock summary from the Google API.')).toBeVisible();
    await expect(sidePanelPage.getByRole('heading', { name: 'Mockery', level: 4 })).toBeVisible();

    await page.close();
  });

  test('Test Case 3: should trigger download for PDF and JSON reports', async () => {
    // 1. Configuration: Use robust locators to configure the extension.
    const apiKeyInput = sidePanelPage.getByLabel('API Key');
    const saveButton = sidePanelPage.getByRole('button', { name: /save & test configuration/i });

    await apiKeyInput.fill('mock-api-key');
    await saveButton.click();
    await expect(apiKeyInput).not.toBeVisible({ timeout: 10000 });
    await expect(sidePanelPage.getByText('Configuration is configured.')).toBeVisible();

    // 2. Perform Analysis: Generate a report to enable the download buttons.
    const analysisTextarea = sidePanelPage.getByPlaceholder(/enter text to analyze/i);
    await analysisTextarea.fill('Text for report download test.');
    await sidePanelPage.getByRole('button', { name: 'Analyze' }).click();
    await expect(sidePanelPage.getByRole('heading', { name: 'Analysis Report', level: 2 })).toBeVisible({timeout: 20000});

    // 3. Test JSON Download
    // Open the download menu using its accessible name, which is a stable selector.
    const shareButton = sidePanelPage.getByRole('button', { name: /share or download report/i });
    await shareButton.click();

    // Concurrently wait for the download event and click the "Download JSON" button.
    const [jsonDownload] = await Promise.all([
        sidePanelPage.waitForEvent('download'),
        sidePanelPage.getByRole('button', { name: 'Download JSON' }).click(),
    ]);

    // Verify the downloaded file has the correct extension.
    expect(jsonDownload.suggestedFilename()).toContain('.json');

    // 4. Test PDF Download
    // Re-open the share menu (it might close after the first download).
    await shareButton.click();

    // Concurrently wait for the download event and click the "Download PDF" button.
    const [pdfDownload] = await Promise.all([
        sidePanelPage.waitForEvent('download', { timeout: 15000 }), // Keep longer timeout for PDF generation
        sidePanelPage.getByRole('button', { name: 'Download PDF' }).click(),
    ]);

    // Verify the downloaded file has the correct extension.
    expect(pdfDownload.suggestedFilename()).toContain('.pdf');
  });

  test('Test Case 4: should allow configuration and analysis with LM Studio', async () => {
    // 1. Select Provider: Switch the configuration to the local provider.
    // The button text comes from the 'config_provider_local' i18n key.
    // We use a flexible regex to find it.
    await sidePanelPage.getByRole('button', { name: /local/i }).click();

    // 2. Fill Configuration: Use getByLabel to find and fill the inputs.
    // The labels are defined by 'config_local_server_url_label' and 'config_local_model_name_label'.
    const urlInput = sidePanelPage.getByLabel(/local server url/i);
    const modelInput = sidePanelPage.getByLabel(/local model name/i);

    await urlInput.fill('http://localhost:1234');
    await modelInput.fill('mock-model-name');

    // 3. Save and Verify: Click the save button and assert success.
    const saveButton = sidePanelPage.getByRole('button', { name: /save & test configuration/i });
    await expect(saveButton).toBeEnabled();
    await saveButton.click();

    // Assert that the configuration form has collapsed by checking that the inputs are gone.
    await expect(urlInput).not.toBeVisible({ timeout: 10000 });
    await expect(sidePanelPage.getByText('Configuration is configured.')).toBeVisible();

    // 4. Perform Analysis: Fill the textarea and trigger the analysis.
    const analysisTextarea = sidePanelPage.getByPlaceholder(/enter text to analyze/i);
    await analysisTextarea.fill('This is text for LM Studio');

    const analyzeButton = sidePanelPage.getByRole('button', { name: 'Analyze' });
    await expect(analyzeButton).toBeEnabled();
    await analyzeButton.click();

    // 5. Assertions: Verify the analysis report content from the mock LM Studio server.
    await expect(sidePanelPage.getByRole('heading', { name: 'Analysis Report', level: 2 })).toBeVisible({ timeout: 20000 });
    await expect(sidePanelPage.getByText('This is a mock summary from LM Studio.')).toBeVisible();
    await expect(sidePanelPage.getByRole('heading', { name: 'Local Mock', level: 4 })).toBeVisible();
  });
});
