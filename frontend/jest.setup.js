require('@testing-library/jest-dom')

// Mock localStorage for tests
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}

global.localStorage = localStorageMock

// Mock uuid module
jest.mock('uuid', () => ({
  v4: () => 'mocked-uuid-' + Math.random().toString(36).substr(2, 9),
}))
