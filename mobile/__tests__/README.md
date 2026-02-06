# Testing Documentation

## Overview

This project uses a comprehensive testing strategy with three levels of testing:

1. **Unit Tests** - Test individual functions, components, and modules
2. **Integration Tests** - Test how different parts work together
3. **E2E Tests** - Test complete user flows in a real environment

## Test Structure

```
__tests__/
├── unit/                    # Unit tests
│   ├── components/          # Component tests
│   ├── features/            # Feature/slice tests
│   ├── services/            # API service tests
│   ├── hooks/               # Custom hooks tests
│   └── utils/               # Utility function tests
├── integration/             # Integration tests
│   ├── auth.integration.test.tsx
│   ├── order.integration.test.tsx
│   ├── chat.integration.test.tsx
│   └── ...
└── README.md               # This file

e2e/                        # E2E tests (Detox)
├── auth.e2e.ts
├── order.e2e.ts
└── jest.config.js
```

## Running Tests

### Unit Tests

```bash
# Run all unit tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- authSlice.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should login"
```

### Integration Tests

```bash
# Run all integration tests
npm run test:integration

# Run specific integration test
npm test -- auth.integration.test.tsx
```

### E2E Tests

```bash
# Build app for E2E testing
npm run build:e2e:ios      # iOS
npm run build:e2e:android  # Android

# Run E2E tests
npm run test:e2e:ios       # iOS
npm run test:e2e:android   # Android

# Run specific E2E test
npm run test:e2e:ios -- --testNamePattern="Login Flow"
```

## Coverage Goals

We aim for the following coverage thresholds:

- **Branches:** 70%
- **Functions:** 70%
- **Lines:** 70%
- **Statements:** 70%

Current coverage can be viewed by running:

```bash
npm run test:coverage
```

Then open `coverage/lcov-report/index.html` in your browser.

## Writing Tests

### Unit Test Example

```typescript
import { render, fireEvent } from '@testing-library/react-native';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    const { getByText } = render(<MyComponent />);
    expect(getByText('Hello')).toBeTruthy();
  });

  it('should handle button press', () => {
    const onPress = jest.fn();
    const { getByText } = render(<MyComponent onPress={onPress} />);
    
    fireEvent.press(getByText('Click Me'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```

### Integration Test Example

```typescript
import { configureStore } from '@reduxjs/toolkit';
import { api } from '../../services/api';
import authReducer from '../../features/auth/authSlice';

describe('Auth Integration', () => {
  let store: ReturnType<typeof configureStore>;

  beforeEach(() => {
    store = configureStore({
      reducer: {
        auth: authReducer,
        [api.reducerPath]: api.reducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(api.middleware),
    });
  });

  it('should handle login flow', async () => {
    // Test implementation
  });
});
```

### E2E Test Example

```typescript
import { device, element, by, expect as detoxExpect } from 'detox';

describe('Login Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  it('should login successfully', async () => {
    await element(by.id('phone-input')).typeText('+996700123456');
    await element(by.id('login-button')).tap();
    await detoxExpect(element(by.id('dashboard'))).toBeVisible();
  });
});
```

## Best Practices

### General

1. **Test Behavior, Not Implementation** - Focus on what the component does, not how it does it
2. **Keep Tests Simple** - One assertion per test when possible
3. **Use Descriptive Names** - Test names should clearly describe what they test
4. **Arrange-Act-Assert** - Structure tests with clear setup, action, and verification
5. **Avoid Test Interdependence** - Each test should be independent

### Component Testing

1. **Test User Interactions** - Focus on how users interact with components
2. **Test Edge Cases** - Empty states, error states, loading states
3. **Use Testing Library Queries** - Prefer `getByRole`, `getByLabelText` over `getByTestId`
4. **Mock External Dependencies** - Mock API calls, navigation, etc.

### API Testing

1. **Test Endpoint Configuration** - Verify endpoints are correctly defined
2. **Test Tag Invalidation** - Ensure cache invalidation works correctly
3. **Test Transformations** - Verify response transformations
4. **Mock Network Calls** - Don't make real API calls in tests

### E2E Testing

1. **Test Critical Paths** - Focus on most important user flows
2. **Use Stable Selectors** - Prefer `testID` over text or accessibility labels
3. **Wait for Elements** - Use `waitFor` to handle async operations
4. **Keep Tests Independent** - Each test should set up its own state

## Mocking

### Mocking Expo Modules

```typescript
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
}));
```

### Mocking API Calls

```typescript
jest.mock('../../services/api', () => ({
  useGetOrdersQuery: () => ({
    data: mockOrders,
    isLoading: false,
    error: null,
  }),
}));
```

### Mocking Navigation

```typescript
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));
```

## Debugging Tests

### Debug Single Test

```bash
# Run with verbose output
npm test -- --verbose MyComponent.test.tsx

# Run with debugging
node --inspect-brk node_modules/.bin/jest --runInBand MyComponent.test.tsx
```

### Debug E2E Tests

```bash
# Run with debug logs
npm run test:e2e:ios -- --loglevel trace

# Take screenshots on failure
npm run test:e2e:ios -- --take-screenshots failing
```

## CI/CD Integration

Tests are automatically run in CI/CD pipeline:

```yaml
# .github/workflows/test.yml
- name: Run tests
  run: npm run test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info
```

## Troubleshooting

### Common Issues

**Issue:** Tests timeout
**Solution:** Increase timeout in jest.config.js or use `jest.setTimeout(10000)`

**Issue:** Mock not working
**Solution:** Ensure mock is defined before import, use `jest.mock()` at top level

**Issue:** E2E tests fail to find elements
**Solution:** Add `testID` props to components, use `waitFor` for async elements

**Issue:** Coverage not accurate
**Solution:** Check `collectCoverageFrom` in jest.config.js

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Detox Documentation](https://wix.github.io/Detox/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Contributing

When adding new features:

1. Write tests first (TDD approach recommended)
2. Ensure all tests pass before committing
3. Maintain or improve coverage percentage
4. Update this documentation if adding new test patterns
