// Set test environment
process.env.NODE_ENV = 'test';

// Set API token for tests
process.env.API_TOKEN = 'test-token';

// Set port for tests
process.env.PORT = '3001';

// Mock logger to avoid console pollution during tests
jest.mock('../utils/logger', () => ({
    fatal: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    trace: jest.fn(),
}));

// Silence console logs during tests
global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
}; 