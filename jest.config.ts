import type { Config } from '@jest/types';

const config: Config.InitialOptions = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/test'],
    testMatch: ['**/*.spec.ts'],
    transform: {
        '^.+\\.tsx?$': 'ts-jest'
    },
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1'
    },
    clearMocks: true,
    collectCoverage: true,
    coverageDirectory: "coverage",
    coveragePathIgnorePatterns: [
        "/node_modules/"
    ]
};

export default config;
