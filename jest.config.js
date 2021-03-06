module.exports = {
  verbose: true,
  browser: false,
  testEnvironment: 'node',
  transform: {},
  collectCoverage: true,
  collectCoverageFrom: [
    '**/*.js',
    '!index.js',
    '!**/node_modules/**',
    '!**/vendor/**',
    '!**/coverage/**',
    '!**/.eslintrc.js',
    '!**/jest.config.js'
  ],
  globals: {
  }
}
