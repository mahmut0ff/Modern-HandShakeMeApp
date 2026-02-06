import { device, element, by, expect, waitFor } from 'detox';

describe('Onboarding E2E', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should show onboarding on first launch', async () => {
    // Clear AsyncStorage to simulate first launch
    await device.clearKeychain();
    await device.launchApp({ newInstance: true, delete: true });

    // Check if onboarding is visible
    await expect(element(by.text('Найдите мастера'))).toBeVisible();
  });

  it('should navigate through onboarding slides', async () => {
    await device.clearKeychain();
    await device.launchApp({ newInstance: true, delete: true });

    // First slide
    await expect(element(by.text('Найдите мастера'))).toBeVisible();

    // Tap next
    await element(by.text('Далее')).tap();

    // Second slide
    await expect(element(by.text('Общайтесь напрямую'))).toBeVisible();

    // Tap next
    await element(by.text('Далее')).tap();

    // Third slide
    await expect(element(by.text('Безопасные сделки'))).toBeVisible();
  });

  it('should skip onboarding', async () => {
    await device.clearKeychain();
    await device.launchApp({ newInstance: true, delete: true });

    // Tap skip
    await element(by.text('Пропустить')).tap();

    // Should navigate to main app
    await waitFor(element(by.text('Мастера')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should complete onboarding', async () => {
    await device.clearKeychain();
    await device.launchApp({ newInstance: true, delete: true });

    // Navigate to last slide
    await element(by.text('Далее')).tap();
    await element(by.text('Далее')).tap();
    await element(by.text('Далее')).tap();

    // Complete onboarding
    await element(by.text('Начать')).tap();

    // Should navigate to main app
    await waitFor(element(by.text('Мастера')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('should not show onboarding on second launch', async () => {
    // First launch - complete onboarding
    await device.clearKeychain();
    await device.launchApp({ newInstance: true, delete: true });
    await element(by.text('Пропустить')).tap();

    // Second launch
    await device.launchApp({ newInstance: true });

    // Should go directly to main app
    await expect(element(by.text('Мастера'))).toBeVisible();
  });
});
