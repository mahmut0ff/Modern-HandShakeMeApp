import { device, element, by, expect as detoxExpect } from 'detox';

describe('Order Management E2E Tests', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
    });
    
    // Login first
    await element(by.id('phone-input')).typeText('+996700123456');
    await element(by.id('login-button')).tap();
    await element(by.id('code-input')).typeText('123456');
    await element(by.id('verify-button')).tap();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Order Creation', () => {
    it('should navigate to create order screen', async () => {
      await element(by.id('create-order-button')).tap();
      await detoxExpect(element(by.id('create-order-screen'))).toBeVisible();
    });

    it('should show category selection', async () => {
      await element(by.id('create-order-button')).tap();
      await detoxExpect(element(by.id('category-select'))).toBeVisible();
    });

    it('should allow entering order title', async () => {
      await element(by.id('create-order-button')).tap();
      await element(by.id('order-title-input')).typeText('Ремонт квартиры');
      await detoxExpect(element(by.id('order-title-input'))).toHaveText('Ремонт квартиры');
    });

    it('should allow entering order description', async () => {
      await element(by.id('create-order-button')).tap();
      await element(by.id('order-description-input')).typeText('Нужен ремонт 2-комнатной квартиры');
      await detoxExpect(element(by.id('order-description-input'))).toHaveText('Нужен ремонт 2-комнатной квартиры');
    });

    it('should allow selecting budget type', async () => {
      await element(by.id('create-order-button')).tap();
      await element(by.id('budget-type-select')).tap();
      await element(by.text('Фиксированная')).tap();
      await detoxExpect(element(by.id('budget-amount-input'))).toBeVisible();
    });

    it('should allow entering budget amount', async () => {
      await element(by.id('create-order-button')).tap();
      await element(by.id('budget-type-select')).tap();
      await element(by.text('Фиксированная')).tap();
      await element(by.id('budget-amount-input')).typeText('50000');
      await detoxExpect(element(by.id('budget-amount-input'))).toHaveText('50000');
    });

    it('should allow selecting city', async () => {
      await element(by.id('create-order-button')).tap();
      await element(by.id('city-select')).tap();
      await element(by.text('Бишкек')).tap();
      await detoxExpect(element(by.id('city-select'))).toHaveText('Бишкек');
    });

    it('should create order successfully', async () => {
      await element(by.id('create-order-button')).tap();
      
      // Fill form
      await element(by.id('category-select')).tap();
      await element(by.text('Ремонт')).tap();
      await element(by.id('order-title-input')).typeText('Ремонт квартиры');
      await element(by.id('order-description-input')).typeText('Нужен ремонт');
      await element(by.id('city-select')).tap();
      await element(by.text('Бишкек')).tap();
      await element(by.id('budget-type-select')).tap();
      await element(by.text('Фиксированная')).tap();
      await element(by.id('budget-amount-input')).typeText('50000');
      
      // Submit
      await element(by.id('create-order-submit-button')).tap();
      
      // Verify success
      await detoxExpect(element(by.text('Заказ создан успешно'))).toBeVisible();
    });
  });

  describe('Order List', () => {
    it('should display orders list', async () => {
      await element(by.id('orders-tab')).tap();
      await detoxExpect(element(by.id('orders-list'))).toBeVisible();
    });

    it('should allow searching orders', async () => {
      await element(by.id('orders-tab')).tap();
      await element(by.id('search-input')).typeText('ремонт');
      await detoxExpect(element(by.id('search-input'))).toHaveText('ремонт');
    });

    it('should allow filtering by category', async () => {
      await element(by.id('orders-tab')).tap();
      await element(by.id('filter-button')).tap();
      await element(by.id('category-filter')).tap();
      await element(by.text('Ремонт')).tap();
      await element(by.id('apply-filters-button')).tap();
    });

    it('should display order details on tap', async () => {
      await element(by.id('orders-tab')).tap();
      await element(by.id('order-item-0')).tap();
      await detoxExpect(element(by.id('order-details-screen'))).toBeVisible();
    });
  });

  describe('Order Details', () => {
    beforeEach(async () => {
      await element(by.id('orders-tab')).tap();
      await element(by.id('order-item-0')).tap();
    });

    it('should display order information', async () => {
      await detoxExpect(element(by.id('order-title'))).toBeVisible();
      await detoxExpect(element(by.id('order-description'))).toBeVisible();
      await detoxExpect(element(by.id('order-budget'))).toBeVisible();
    });

    it('should show client information', async () => {
      await detoxExpect(element(by.id('client-info'))).toBeVisible();
    });

    it('should allow adding to favorites', async () => {
      await element(by.id('favorite-button')).tap();
      await detoxExpect(element(by.id('favorite-button'))).toHaveToggleValue(true);
    });

    it('should show applications count', async () => {
      await detoxExpect(element(by.id('applications-count'))).toBeVisible();
    });
  });

  describe('Order Editing', () => {
    beforeEach(async () => {
      await element(by.id('orders-tab')).tap();
      await element(by.id('my-orders-filter')).tap();
      await element(by.id('order-item-0')).tap();
    });

    it('should show edit button for own orders', async () => {
      await detoxExpect(element(by.id('edit-order-button'))).toBeVisible();
    });

    it('should navigate to edit screen', async () => {
      await element(by.id('edit-order-button')).tap();
      await detoxExpect(element(by.id('edit-order-screen'))).toBeVisible();
    });

    it('should allow updating order title', async () => {
      await element(by.id('edit-order-button')).tap();
      await element(by.id('order-title-input')).clearText();
      await element(by.id('order-title-input')).typeText('Обновленный заказ');
      await element(by.id('save-order-button')).tap();
      await detoxExpect(element(by.text('Заказ обновлен'))).toBeVisible();
    });
  });
});
