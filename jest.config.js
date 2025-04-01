module.exports = {
    // Basic configuration
    testEnvironment: 'node',

    // Test timeout in milliseconds
    testTimeout: 10000,

    // Test match pattern
    testMatch: ['**/tests/**/*.test.js'],

    // Coverage configuration
    collectCoverageFrom: [
        'utils/**/*.js',
        'routes/**/*.js',
        'middleware/**/*.js',
        '!**/node_modules/**',
        '!**/vendor/**',
    ],

    // Configure coverage thresholds
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70,
        },
    },

    // Do not collect coverage from these files
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/tests/',
        '/coverage/'
    ],

    // Mock all required files to avoid side effects
    clearMocks: true,

    // Setup files to run before tests
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
}; 