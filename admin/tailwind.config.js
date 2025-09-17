/** @type {import('tailwindcss').Config} */
module.exports = {
  ...require('../packages/ui/tailwind.base.config.js'),
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    '../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    ...require('../packages/ui/tailwind.base.config.js').theme,
    extend: {
      ...require('../packages/ui/tailwind.base.config.js').theme.extend,
      // Admin-specific customizations
      colors: {
        ...require('../packages/ui/tailwind.base.config.js').theme.extend.colors,
        // Admin-specific professional color scheme
        'admin-primary': {
          DEFAULT: 'hsl(210 15% 16%)',
          50: 'hsl(210 20% 98%)',
          100: 'hsl(210 20% 95%)',
          500: 'hsl(210 15% 16%)',
          600: 'hsl(210 24% 10%)',
          900: 'hsl(210 24% 6%)'
        },
        // Dashboard-specific colors
        'dashboard': {
          success: 'hsl(138 76% 42%)',
          warning: 'hsl(48 96% 53%)',
          danger: 'hsl(0 84% 60%)',
          info: 'hsl(210 100% 60%)'
        }
      }
    }
  }
}