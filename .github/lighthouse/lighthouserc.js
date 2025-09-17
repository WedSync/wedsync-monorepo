module.exports = {
  ci: {
    collect: {
      url: [
        process.env.WEDSYNC_PREVIEW_URL || 'http://localhost:3000',
        process.env.WEDME_PREVIEW_URL || 'http://localhost:3001',
      ].filter(Boolean),
      numberOfRuns: 3,
      settings: {
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
        preset: 'desktop',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
        'categories:pwa': ['warn', { minScore: 0.6 }],

        // Core Web Vitals
        'first-contentful-paint': ['warn', { maxNumericValue: 2500 }],
        'largest-contentful-paint': ['warn', { maxNumericValue: 4000 }],
        'cumulative-layout-shift': ['warn', { maxNumericValue: 0.1 }],
        'speed-index': ['warn', { maxNumericValue: 4000 }],
        'total-blocking-time': ['warn', { maxNumericValue: 600 }],

        // Best practices
        'unused-javascript': ['warn', { maxNumericValue: 100000 }],
        'render-blocking-resources': ['warn', { maxNumericValue: 500 }],
        'uses-optimized-images': 'error',
        'modern-image-formats': 'warn',
        'uses-webp-images': 'warn',
        'efficient-animated-content': 'warn',
        'uses-responsive-images': 'warn',

        // Security
        'is-on-https': 'error',
        'no-vulnerable-libraries': 'error',
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};