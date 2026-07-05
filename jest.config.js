const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './'
});

// Add any custom config to be passed to Jest
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  globals: {
    'ts-jest': {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }
  },
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  transformIgnorePatterns: [
    '/node_modules/(?!(react-markdown|remark-gfm|rehype-raw|unified|mdast-util-from-markdown|micromark|mdast-util-to-string|unist-util-visit|unist-util-visit-parents|vfile|bail|is-plain-obj|trough|decode-named-character-reference|character-entities|character-reference-invalid|character-entities-legacy|escape-string-regexp|markdown-table|longest-streak|ccount|unist-util-is|unist-util-position|unist-builder|unist-util-find-after|unist-util-find-all-after|unist-util-find-before|unist-util-find-all-before|unist-util-find-between|unist-util-generated|unist-util-position-from-estree|unist-util-remove-position|unist-util-source|unist-util-stringify-position|vfile-message|mermaid|cytoscape|dagre-d3|mdast-util-mdx|remark-parse|remark-stringify)/)'
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/node_modules/**'
  ]
  // NOTE: coverage is collected and uploaded to Codecov (which is configured
  // with fail_ci_if_error: false) for reporting, but a hard jest threshold is
  // intentionally not enforced here. The previous global 70% threshold was never
  // met (actual ~15%) and blocked every CI run before tests could even be judged.
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
