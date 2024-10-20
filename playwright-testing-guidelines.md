# Playwright Testing Guidelines

## Test Organization

1. Store all tests under the `tests/` folder.
2. Name test files according to the system component being tested (conceptual component, not React component).
   Example: `tests/user-authentication.spec.ts`

## Test Structure and Best Practices

1. Make tests reproducible and isolated.
2. Test actual functionalities from a user's perspective.
3. Use Playwright's `test` function to define test cases.
4. Group related tests using `test.describe()`.
5. Use `test.beforeEach()` and `test.afterEach()` for setup and teardown.

## Locators and Selectors

1. Prefer `getByRole()` locator whenever possible.
2. Use semantic locators in this order of preference:
   - `getByRole()`
   - `getByLabel()`
   - `getByPlaceholder()`
   - `getByText()`
   - `getByTestId()` (only when absolutely necessary)

3. Avoid using CSS selectors or XPath unless there's no alternative.

## Assertions

1. Use Playwright's built-in assertions (`expect()`) for reliable checks.
2. Test for both positive and negative scenarios.
3. Assert visible elements before interacting with them.

## Handling Asynchronous Operations

1. Use `await` for all asynchronous operations.
2. Utilize Playwright's auto-waiting mechanism.
3. Use `page.waitForSelector()` or `page.waitForResponse()` when necessary.

## Test Data Management

1. Use dynamic test data generation when possible.
2. Avoid hardcoding test data directly in test files.
3. Consider using fixtures for complex test data setup.

## Error Handling and Debugging

1. Use `test.fail()` for known issues or expected failures.
2. Implement proper error handling and logging.
3. Use Playwright's built-in debugging tools when needed.

## Performance Considerations

1. Keep tests focused and concise.
2. Avoid unnecessary waits or delays.
3. Use Playwright's `test.slow()` for tests that are expected to be slow.

## Continuous Integration

1. Ensure tests can run in CI/CD environments.
2. Configure appropriate timeouts for CI runs.
3. Use Playwright's ability to run tests in parallel when possible.

## Maintenance and Readability

1. Write clear, descriptive test names.
2. Use comments to explain complex test logic or setups.
3. Regularly review and update tests as the application evolves.

## Avoiding Flaky Tests

1. Don't rely on fixed timeouts; use Playwright's auto-waiting instead.
2. Ensure proper cleanup after each test.
3. Be cautious with date/time-dependent tests.
4. Avoid testing third-party services directly; mock when necessary.

## Example Test Structure

## Advanced Testing Scenarios

### File Upload/Download

```typescript
test('file upload', async ({ page }) => {
  await page.goto('/upload');
  
  // File upload
  await page.setInputFiles('input[type="file"]', 'path/to/file.jpg');
  await page.getByRole('button', { name: 'Upload' }).click();
  
  await expect(page.getByText('File uploaded successfully')).toBeVisible();
});

test('file download', async ({ page }) => {
  await page.goto('/download');
  
  // Start waiting for download before clicking
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download File' }).click();
  const download = await downloadPromise;
  
  // Wait for the download process to complete
  const path = await download.path();
  expect(path).toBeTruthy();
});
```

### Multi-tab Navigation

```typescript
test('navigate between multiple tabs', async ({ context }) => {
  const page1 = await context.newPage();
  await page1.goto('/page1');

  const [page2] = await Promise.all([
    context.waitForEvent('page'),
    page1.getByRole('link', { name: 'Open in new tab' }).click()
  ]);

  await page2.waitForLoadState();
  expect(page2.url()).toContain('/page2');

  await page2.getByRole('button', { name: 'Submit' }).click();
  await expect(page2.getByText('Submission successful')).toBeVisible();

  await page1.bringToFront();
  await expect(page1.getByRole('heading', { name: 'Page 1' })).toBeVisible();
});
```

## Mocking Network Requests

### Mocking API Responses

```typescript
test('display user profile with mocked data', async ({ page }) => {
  await page.route('**/api/user-profile', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        name: 'John Doe',
        email: 'john@example.com',
        role: 'Admin'
      })
    });
  });

  await page.goto('/user-profile');
  await expect(page.getByText('John Doe')).toBeVisible();
  await expect(page.getByText('john@example.com')).toBeVisible();
  await expect(page.getByText('Admin')).toBeVisible();
});
```

### Simulating Network Errors

```typescript
test('handle network error gracefully', async ({ page }) => {
  await page.route('**/api/data', route => route.abort('failed'));

  await page.goto('/data-page');
  await expect(page.getByText('Failed to load data. Please try again.')).toBeVisible();
});
```

## Asynchronous Handling Tips

### Waiting for Slow-Loading Elements

```typescript
test('interact with slow-loading element', async ({ page }) => {
  await page.goto('/slow-page');

  // Wait for a specific element to be visible
  await page.waitForSelector('.slow-loading-element', { state: 'visible', timeout: 10000 });

  // Or wait for network to be idle
  await page.waitForLoadState('networkidle');

  await page.getByRole('button', { name: 'Load More' }).click();
  await expect(page.getByText('Additional Content')).toBeVisible();
});
```

### Handling Animations

```typescript
test('interact with element after animation', async ({ page }) => {
  await page.goto('/animated-page');

  // Wait for animation to complete
  await page.waitForSelector('.animated-element', { state: 'visible' });
  await page.waitForTimeout(1000); // Allow animation to finish (use with caution)

  await page.getByRole('button', { name: 'Animated Button' }).click();
  await expect(page.getByText('Animation Complete')).toBeVisible();
});
```

### Waiting for Multiple Conditions

```typescript
test('complex loading scenario', async ({ page }) => {
  await page.goto('/complex-page');

  await Promise.all([
    page.waitForResponse('**/api/data'),
    page.waitForSelector('#loading-indicator', { state: 'detached' }),
    page.waitForSelector('#content', { state: 'visible' })
  ]);

  await expect(page.getByRole('heading', { name: 'Data Loaded' })).toBeVisible();
});
```

Remember: These examples demonstrate more complex scenarios, but always ensure your tests remain focused and avoid unnecessary complexity. Use these patterns judiciously based on your application's specific needs.
