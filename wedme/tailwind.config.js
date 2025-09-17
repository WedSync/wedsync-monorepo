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
      // WedMe-specific customizations
      colors: {
        ...require('../packages/ui/tailwind.base.config.js').theme.extend.colors,
        // Couple-specific brand variations with softer tones
        'wedme-primary': {
          DEFAULT: 'hsl(270 91% 65%)',
          50: 'hsl(270 100% 98%)',
          100: 'hsl(270 100% 95%)',
          500: 'hsl(270 91% 65%)',
          600: 'hsl(270 91% 58%)',
          900: 'hsl(270 91% 28%)'
        },
        // Romantic accent colors for couples
        'romantic': {
          DEFAULT: 'hsl(340 100% 95%)',
          50: 'hsl(340 100% 99%)',
          100: 'hsl(340 100% 95%)',
          200: 'hsl(340 100% 90%)',
          500: 'hsl(340 82% 52%)'
        }
      }
    }
  }
}