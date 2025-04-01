module.exports = {
    // Indicates which environment should be used for testing
    testEnvironment: 'node',

    // The glob patterns Jest uses to detect test files
    testMatch: [
        '**/tests/**/*.test.js',
        '**/tests/**/*.spec.js'
    ],

    // An array of regexp pattern strings that are matched against all test paths
    // matched tests are skipped
    testPathIgnorePatterns: [
        '/node_modules/'
    ],

    // Indicates whether each individual test should be reported during the run
    verbose: true,

    // Automatically clear mock calls and instances between every test
    clearMocks: true,

    // The directory where Jest should output its coverage files
    coverageDirectory: 'coverage',

    // An array of regexp pattern strings used to skip coverage collection
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/tests/'
    ],

    // Collect coverage from these directories
    collectCoverageFrom: [
        'routes/**/*.js',
        'middleware/**/*.js',
        'utils/**/*.js',
        'app.js'
    ],

    // The maximum amount of workers used to run your tests
    maxWorkers: '50%',

    // A list of reporter names that Jest uses when writing coverage reports
    coverageReporters: ['text', 'lcov'],

    // The threshold enforcement for coverage results
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70
        }
    },

    // Setup files to run before tests
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
}; 