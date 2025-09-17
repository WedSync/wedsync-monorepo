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
      // WedSync-specific customizations
      colors: {
        ...require('../packages/ui/tailwind.base.config.js').theme.extend.colors,
        // Supplier-specific brand variations
        'wedsync-primary': {
          DEFAULT: 'hsl(340 82% 52%)',
          50: 'hsl(340 100% 98%)',
          100: 'hsl(340 100% 95%)',
          500: 'hsl(340 82% 52%)',
          600: 'hsl(340 82% 45%)',
          900: 'hsl(340 82% 26%)'
        }
      }
    }
  }
}