import { test, expect } from '@playwright/test';

test('Avatar Creator - Offer Details tab removal and functionality check', async ({ page }) => {
  // Increase the test timeout
  test.setTimeout(180000); // 3 minutes total timeout

  // Navigate to the page
  await page.goto('http://localhost:3000'); // Adjust the URL as needed

  // Fill in the initial form
  await page.fill('#targetAudience', 'Busy professionals');
  await page.fill('#helpDescription', 'Managing time effectively');
  await page.selectOption('select', 'lowTicket');

  // Click the generate button
  await page.click('button:has-text("Generate Avatar and Offer")');

  // Wait for 1 minute and 20 seconds
  await page.waitForTimeout(80000); // 80000 ms = 1 minute and 20 seconds

  // Now wait for the avatar to be visible
  await page.waitForSelector('.avatar-container:has-text("AI-generated avatar")', { timeout: 20000 });

  // Verify that the "Offer Details" tab is not present
  const offerDetailsTab = await page.locator('button:has-text("Offer Details")');
  await expect(offerDetailsTab).toHaveCount(0);

  // Check that other tabs are present and functional
  const tabNames = [
    'Personal Details', 'Story', 'Current Wants', 'Pain Points', 'Desires',
    'Offer Results', 'Biggest Problem', 'Humiliation', 'Frustrations',
    'Complaints', 'Worries', 'Cost of Not Buying', 'Biggest Want'
  ];

  for (const tabName of tabNames) {
    const tab = page.locator(`button:has-text("${tabName}")`);
    await expect(tab).toBeVisible();
    await tab.click();
    await expect(page.locator(`h2:has-text("${tabName}")`)).toBeVisible();
  }

  // Verify that the avatar details are rendered correctly
  await expect(page.locator('.avatar')).toBeVisible();
  await expect(page.locator('text=AI-generated avatar based on your inputs')).toBeVisible();

  // Check for the presence of key UI elements
  await expect(page.locator('button:has-text("Load Avatar")')).toBeVisible();
  await expect(page.locator('button:has-text("Save Avatar")')).toBeVisible();
  await expect(page.locator('button:has-text("Download PDF")')).toBeVisible();
  await expect(page.locator('button:has-text("Delete Avatar")')).toBeVisible();

  // Verify that the content area is rendered
  await expect(page.locator('.card-content')).toBeVisible();

  // Check that the ReactQuill editor is present in each tab
  for (const tabName of tabNames) {
    await page.click(`button:has-text("${tabName}")`);
    await expect(page.locator('.ql-editor')).toBeVisible();
  }

  // Verify that the "Add with AI" button is present where applicable
  const tabsWithAddAI = [
    'Story', 'Current Wants', 'Pain Points', 'Desires', 'Offer Results',
    'Biggest Problem', 'Humiliation', 'Frustrations', 'Complaints', 'Worries',
    'Cost of Not Buying', 'Biggest Want'
  ];

  for (const tabName of tabsWithAddAI) {
    await page.click(`button:has-text("${tabName}")`);
    await expect(page.locator('button:has-text("Add with AI")')).toBeVisible();
  }

  // Check that the "Add with AI" button is not present in the "Personal Details" tab
  await page.click('button:has-text("Personal Details")');
  await expect(page.locator('button:has-text("Add with AI")')).toHaveCount(0);
  // Ensure there are no console errors
  const consoleMessages: any[] = [];
  page.on('console', msg => consoleMessages.push(msg));

  // Check console for errors after all interactions
  const errors = consoleMessages.filter(msg => msg.type() === 'error');
  expect(errors).toHaveLength(0);
});
