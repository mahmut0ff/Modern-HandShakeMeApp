describe('Search and Filters E2E', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should search for masters', async () => {
    // Navigate to masters screen
    await element(by.text('Мастера')).tap();

    // Type in search bar
    await element(by.id('search-input')).typeText('Иван');

    // Wait for results
    await waitFor(element(by.text('Иван Петров')))
      .toBeVisible()
      .withTimeout(3000);
  });

  it('should filter masters by city', async () => {
    await element(by.text('Мастера')).tap();

    // Open filters
    await element(by.id('filter-button')).tap();

    // Select city
    await element(by.id('city-input')).typeText('Москва');

    // Apply filters
    await element(by.text('Применить')).tap();

    // Check results
    await expect(element(by.text('Москва'))).toBeVisible();
  });

  it('should clear search', async () => {
    await element(by.text('Мастера')).tap();

    // Type in search
    await element(by.id('search-input')).typeText('Test');

    // Clear search
    await element(by.id('clear-search')).tap();

    // Search should be empty
    await expect(element(by.id('search-input'))).toHaveText('');
  });

  it('should paginate results', async () => {
    await element(by.text('Мастера')).tap();

    // Scroll to pagination
    await element(by.id('masters-list')).scrollTo('bottom');

    // Go to next page
    await element(by.text('2')).tap();

    // Check page changed
    await waitFor(element(by.text('1')))
      .toBeVisible()
      .withTimeout(2000);
  });
});
