import { device, element, by, expect, waitFor } from 'detox';

describe('Chat E2E', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should send text message', async () => {
    // Navigate to chat
    await element(by.text('Чат')).tap();

    // Open chat room
    await element(by.id('chat-item-1')).tap();

    // Type message
    await element(by.id('message-input')).typeText('Hello, World!');

    // Send message
    await element(by.id('send-button')).tap();

    // Check message appears
    await expect(element(by.text('Hello, World!'))).toBeVisible();
  });

  it('should show typing indicator', async () => {
    await element(by.text('Чат')).tap();
    await element(by.id('chat-item-1')).tap();

    // Start typing
    await element(by.id('message-input')).typeText('Test');

    // Typing indicator should appear (simulated)
    await waitFor(element(by.id('typing-indicator')))
      .toBeVisible()
      .withTimeout(2000);
  });

  it('should upload image', async () => {
    await element(by.text('Чат')).tap();
    await element(by.id('chat-item-1')).tap();

    // Open attachment menu
    await element(by.id('attachment-button')).tap();

    // Select image
    await element(by.text('Галерея')).tap();

    // Image should be uploaded (mocked)
    await waitFor(element(by.id('image-message')))
      .toBeVisible()
      .withTimeout(5000);
  });
});
