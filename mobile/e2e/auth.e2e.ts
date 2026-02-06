import { device, element, by, expect as detoxExpect } from 'detox';

describe('Authentication E2E Tests', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { notifications: 'YES' },
    });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Login Flow', () => {
    it('should display login screen', async () => {
      await detoxExpect(element(by.id('login-screen'))).toBeVisible();
    });

    it('should show phone input field', async () => {
      await detoxExpect(element(by.id('phone-input'))).toBeVisible();
    });

    it('should allow entering phone number', async () => {
      await element(by.id('phone-input')).typeText('+996700123456');
      await detoxExpect(element(by.id('phone-input'))).toHaveText('+996700123456');
    });

    it('should show error for invalid phone', async () => {
      await element(by.id('phone-input')).typeText('123');
      await element(by.id('login-button')).tap();
      await detoxExpect(element(by.text('Неверный формат номера'))).toBeVisible();
    });

    it('should navigate to verification screen after valid phone', async () => {
      await element(by.id('phone-input')).typeText('+996700123456');
      await element(by.id('login-button')).tap();
      await detoxExpect(element(by.id('verification-screen'))).toBeVisible();
    });

    it('should allow entering verification code', async () => {
      await element(by.id('phone-input')).typeText('+996700123456');
      await element(by.id('login-button')).tap();
      await element(by.id('code-input')).typeText('123456');
      await detoxExpect(element(by.id('code-input'))).toHaveText('123456');
    });

    it('should navigate to dashboard after successful login', async () => {
      await element(by.id('phone-input')).typeText('+996700123456');
      await element(by.id('login-button')).tap();
      await element(by.id('code-input')).typeText('123456');
      await element(by.id('verify-button')).tap();
      await detoxExpect(element(by.id('dashboard-screen'))).toBeVisible();
    });
  });

  describe('Registration Flow', () => {
    it('should navigate to registration screen', async () => {
      await element(by.id('register-link')).tap();
      await detoxExpect(element(by.id('register-screen'))).toBeVisible();
    });

    it('should show role selection', async () => {
      await element(by.id('register-link')).tap();
      await detoxExpect(element(by.id('client-role-button'))).toBeVisible();
      await detoxExpect(element(by.id('master-role-button'))).toBeVisible();
    });

    it('should allow selecting client role', async () => {
      await element(by.id('register-link')).tap();
      await element(by.id('client-role-button')).tap();
      await detoxExpect(element(by.id('client-role-button'))).toHaveToggleValue(true);
    });

    it('should allow selecting master role', async () => {
      await element(by.id('register-link')).tap();
      await element(by.id('master-role-button')).tap();
      await detoxExpect(element(by.id('master-role-button'))).toHaveToggleValue(true);
    });

    it('should require all fields for registration', async () => {
      await element(by.id('register-link')).tap();
      await element(by.id('register-submit-button')).tap();
      await detoxExpect(element(by.text('Заполните все поля'))).toBeVisible();
    });
  });

  describe('Logout Flow', () => {
    beforeEach(async () => {
      // Login first
      await element(by.id('phone-input')).typeText('+996700123456');
      await element(by.id('login-button')).tap();
      await element(by.id('code-input')).typeText('123456');
      await element(by.id('verify-button')).tap();
    });

    it('should navigate to settings', async () => {
      await element(by.id('settings-tab')).tap();
      await detoxExpect(element(by.id('settings-screen'))).toBeVisible();
    });

    it('should show logout button', async () => {
      await element(by.id('settings-tab')).tap();
      await detoxExpect(element(by.id('logout-button'))).toBeVisible();
    });

    it('should logout and return to login screen', async () => {
      await element(by.id('settings-tab')).tap();
      await element(by.id('logout-button')).tap();
      await element(by.text('Выйти')).tap(); // Confirm dialog
      await detoxExpect(element(by.id('login-screen'))).toBeVisible();
    });
  });
});
