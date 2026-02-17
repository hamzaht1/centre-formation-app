module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  testMatch: ['**/*.test.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.js$': ['babel-jest', { configFile: './babel.test.config.js' }],
  },
  transformIgnorePatterns: ['/node_modules/(?!(@prisma)/)'],
};
