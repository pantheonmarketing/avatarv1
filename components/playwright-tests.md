Implement comprehensive end-to-end test based on the functionality in question. Following the following rules:

The tests are reproducible
Tests actual functionalities from a user's perspective
When you see unreasonable tests or tests that could potentially be flaky or useless, make sure to call it out in your response.
All tests should be stored under the tests/ folder.
Test filename should correspond to the system component - the conceptual component, not the React component that we are testing.
Follow Playwright best practices. In test, always prefer getByRole locator. Do not use test-id locators unless absolutely necessary.
Don’t create new tests unless you are instructed to