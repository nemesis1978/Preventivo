// frontend/jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
});

// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const customJestConfig = {
  // Add more setup options before each test is run
  // setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    // Handle module aliases (this will be automatically configured for you soon)
    '^@/components/(.*)$': '<rootDir>/src/components/$1',
    '^@/app/(.*)$': '<rootDir>/src/app/$1',
    '^@/lib/(.*)$': '<rootDir>/src/lib/$1',
    // Mock bcryptjs per evitare errori di compilazione nativa in ambiente di test
    '^bcryptjs$': '<rootDir>/__mocks__/bcryptjs.js',
    // Handle CSS imports (CSS Modules, global CSS, etc.)
    '^.+\.(css|sass|scss)$': 'identity-obj-proxy',
    // Mock next/navigation for App Router
    '^next/navigation$': '<rootDir>/__mocks__/nextNavigation.js',
    // Mock next/font
    '^next/font/(.*)$': '<rootDir>/__mocks__/nextFont.js',
    // Mock next/script
    '^next/script$': '<rootDir>/__mocks__/nextScript.js',
  },
  // Necessario per Prisma, altrimenti potrebbe dare errori relativi a ESM
  transformIgnorePatterns: [
    '/node_modules/(?!(next|@next|@babel|@swc|@prisma/client|jose|next-auth|@panva/hkdf|uuid|oauth|openid-client|oauth4webapi|lucide-react|d3|d3-array|d3-axis|d3-brush|d3-chord|d3-color|d3-contour|d3-delaunay|d3-dispatch|d3-drag|d3-dsv|d3-ease|d3-fetch|d3-force|d3-format|d3-geo|d3-hierarchy|d3-interpolate|d3-path|d3-polygon|d3-quadtree|d3-random|d3-scale|d3-scale-chromatic|d3-selection|d3-shape|d3-time|d3-time-format|d3-timer|d3-transition|d3-zoom|internmap|.*\\.mjs$))/',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'], // Aggiungi se hai un file di setup
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);