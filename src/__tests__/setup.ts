/**
 * Configuração de Setup para Testes
 */

import '@testing-library/jest-dom';

// Mock do localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  key: jest.fn(),
  length: 0,
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock do sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: localStorageMock,
});

// Mock do navigator
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
});

// Mock do fetch
global.fetch = jest.fn();

// Mock do console para reduzir ruído nos testes
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  jest.clearAllMocks();
});

// Mock de timers para testes que usam setTimeout/setInterval
jest.useFakeTimers();

// Configuração global para testes assíncronos
jest.setTimeout(10000);