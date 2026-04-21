module.exports = {
  testEnvironment: 'node',
  preset: 'ts-jest',
  testMatch: ['**/tests/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
};
