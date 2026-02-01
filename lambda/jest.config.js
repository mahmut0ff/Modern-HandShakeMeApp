/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.(ts|js)',
    '**/*.(test|spec).(ts|js)'
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'core/**/*.{ts,js}',
    '!core/**/*.d.ts',
    '!core/**/__tests__/**',
    '!core/**/node_modules/**'
  ],
  
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Coverage thresholds - enforce minimum coverage
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    },
    // Critical files must have higher coverage
    './core/auth/*.ts': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90
    },
    './core/kyrgyzstan/*.ts': {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  
  // Module name mapping
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/core/$1',
    '^@tests/(.*)$': '<rootDir>/__tests__/$1'
  },
  
  // Transform configuration
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output for critical tests
  verbose: true,
  
  // Fail fast on critical test failures
  bail: 1,
  
  // Environment variables for tests
  setupFiles: ['<rootDir>/__tests__/env.setup.js']
};