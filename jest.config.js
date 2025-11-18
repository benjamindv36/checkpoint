/**
 * Jest configuration for TypeScript using ts-jest
 */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom', // Changed from 'node' to support React components
  testMatch: ['<rootDir>/src/tests/**/*.test.ts', '<rootDir>/src/tests/**/*.test.tsx'], // Added .tsx support
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1', // Fixed mapper to point to src directory
    '\.(css|less|scss|sass)$': 'identity-obj-proxy', // Mock CSS imports
  },
  transform: {
    '^.+\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react', // Enable JSX support
      },
    }],
  },
  clearMocks: true,
};
