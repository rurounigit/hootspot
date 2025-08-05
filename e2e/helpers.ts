import { type BrowserContext, type Page, expect } from '@playwright/test';

/**
 * Finds and returns the extension's side panel page from the browser context.
 * This helper is crucial because Playwright sees multiple "pages": the main web page,
 * the service worker, and the side panel itself. This abstracts the logic for finding
 * the correct page object representing the side panel.
 *
 * @param {BrowserContext} browserContext - The Playwright browser context.
 * @returns {Promise<Page>} A promise that resolves to the side panel's Page object.
 */
export async function getSidePanel(browserContext: BrowserContext): Promise<Page> {
  // It can take a moment for the extension to initialize and open the side panel.
  // We'll wait until we find the page.
  let sidePanelPage: Page | undefined;

  // Poll for the side panel page to appear.
  await expect(async () => {
    const pages = browserContext.pages();
    for (const page of pages) {
      if (page.url().startsWith('chrome-extension://')) {
        sidePanelPage = page;
        return;
      }
    }
    // Throw an error to continue polling if the page is not found yet.
    throw new Error("Side panel not found yet...");
  }).toPass({ timeout: 5000 }); // Wait up to 5 seconds.

  if (!sidePanelPage) {
    throw new Error("Could not find the extension's side panel. Ensure it's set to open by default.");
  }

  return sidePanelPage;
}