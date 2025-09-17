/**
 * WedSync & WedMe Design System Tokens
 * Shared design tokens for consistent theming across all applications
 */

export const designTokens = {
  // Wedding-themed color palette
  colors: {
    // Brand colors
    primary: {
      50: 'hsl(340, 100%, 98%)',
      100: 'hsl(340, 100%, 95%)', 
      200: 'hsl(340, 100%, 90%)',
      300: 'hsl(340, 100%, 82%)',
      400: 'hsl(340, 100%, 70%)',
      500: 'hsl(340, 82%, 52%)', // Main brand color - romantic rose
      600: 'hsl(340, 82%, 45%)',
      700: 'hsl(340, 82%, 38%)',
      800: 'hsl(340, 82%, 32%)',
      900: 'hsl(340, 82%, 26%)',
      950: 'hsl(340, 82%, 15%)'
    },
    
    // Secondary palette - elegant purple
    secondary: {
      50: 'hsl(270, 100%, 98%)',
      100: 'hsl(270, 100%, 95%)',
      200: 'hsl(270, 100%, 90%)',
      300: 'hsl(270, 100%, 82%)',
      400: 'hsl(270, 95%, 70%)',
      500: 'hsl(270, 91%, 65%)', // Elegant lavender
      600: 'hsl(270, 91%, 58%)',
      700: 'hsl(270, 91%, 48%)',
      800: 'hsl(270, 91%, 38%)',
      900: 'hsl(270, 91%, 28%)',
      950: 'hsl(270, 91%, 18%)'
    },
    
    // Accent colors - wedding gold
    accent: {
      50: 'hsl(45, 100%, 98%)',
      100: 'hsl(45, 100%, 95%)',
      200: 'hsl(45, 100%, 90%)', 
      300: 'hsl(45, 100%, 82%)',
      400: 'hsl(45, 100%, 70%)',
      500: 'hsl(45, 90%, 60%)', // Wedding gold
      600: 'hsl(45, 90%, 52%)',
      700: 'hsl(45, 90%, 42%)',
      800: 'hsl(45, 90%, 32%)',
      900: 'hsl(45, 90%, 22%)',
      950: 'hsl(45, 90%, 12%)'
    },
    
    // Neutral grays
    neutral: {
      50: 'hsl(210, 20%, 98%)',
      100: 'hsl(210, 20%, 95%)',
      200: 'hsl(210, 16%, 93%)',
      300: 'hsl(210, 14%, 89%)',
      400: 'hsl(210, 14%, 83%)',
      500: 'hsl(210, 11%, 71%)',
      600: 'hsl(210, 7%, 56%)',
      700: 'hsl(210, 9%, 31%)',
      800: 'hsl(210, 10%, 23%)',
      900: 'hsl(210, 15%, 16%)',
      950: 'hsl(210, 24%, 10%)'
    },
    
    // Semantic colors
    success: {
      50: 'hsl(138, 76%, 97%)',
      500: 'hsl(138, 76%, 42%)',
      600: 'hsl(138, 76%, 35%)'
    },
    warning: {
      50: 'hsl(48, 96%, 95%)',
      500: 'hsl(48, 96%, 53%)',
      600: 'hsl(48, 96%, 47%)'
    },
    error: {
      50: 'hsl(0, 93%, 97%)',
      500: 'hsl(0, 84%, 60%)',
      600: 'hsl(0, 84%, 54%)'
    }
  },
  
  // Typography scale
  typography: {
    fontFamily: {
      sans: ['Inter', 'system-ui', 'sans-serif'],
      serif: ['Playfair Display', 'Georgia', 'serif'], // Elegant for wedding content
      mono: ['JetBrains Mono', 'monospace']
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem' }],
      sm: ['0.875rem', { lineHeight: '1.25rem' }],
      base: ['1rem', { lineHeight: '1.5rem' }],
      lg: ['1.125rem', { lineHeight: '1.75rem' }],
      xl: ['1.25rem', { lineHeight: '1.75rem' }],
      '2xl': ['1.5rem', { lineHeight: '2rem' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      '5xl': ['3rem', { lineHeight: '1' }],
      '6xl': ['3.75rem', { lineHeight: '1' }]
    }
  },
  
  // Spacing scale
  spacing: {
    px: '1px',
    0: '0px',
    0.5: '0.125rem',
    1: '0.25rem',
    1.5: '0.375rem',
    2: '0.5rem',
    2.5: '0.625rem',
    3: '0.75rem',
    3.5: '0.875rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    7: '1.75rem',
    8: '2rem',
    9: '2.25rem',
    10: '2.5rem',
    11: '2.75rem',
    12: '3rem',
    14: '3.5rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    28: '7rem',
    32: '8rem',
    36: '9rem',
    40: '10rem',
    44: '11rem',
    48: '12rem',
    52: '13rem',
    56: '14rem',
    60: '15rem',
    64: '16rem',
    72: '18rem',
    80: '20rem',
    96: '24rem'
  },
  
  // Border radius
  borderRadius: {
    none: '0px',
    sm: '0.125rem',
    DEFAULT: '0.25rem',
    md: '0.375rem',
    lg: '0.5rem',
    xl: '0.75rem',
    '2xl': '1rem',
    '3xl': '1.5rem',
    full: '9999px'
  },
  
  // Shadows
  boxShadow: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    DEFAULT: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
    inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
    none: 'none'
  },
  
  // Animation durations
  animation: {
    duration: {
      75: '75ms',
      100: '100ms',
      150: '150ms',
      200: '200ms',
      300: '300ms',
      500: '500ms',
      700: '700ms',
      1000: '1000ms'
    }
  }
};

// CSS variables mapping for light theme
export const lightThemeVars = {
  // Core semantic colors
  '--background': designTokens.colors.neutral[50],
  '--foreground': designTokens.colors.neutral[900],
  
  // Primary brand colors
  '--primary': designTokens.colors.primary[500],
  '--primary-foreground': designTokens.colors.neutral[50],
  '--primary-muted': designTokens.colors.primary[100],
  
  // Secondary colors
  '--secondary': designTokens.colors.secondary[100],
  '--secondary-foreground': designTokens.colors.secondary[900],
  
  // Accent colors
  '--accent': designTokens.colors.accent[100],
  '--accent-foreground': designTokens.colors.accent[900],
  
  // Muted colors
  '--muted': designTokens.colors.neutral[100],
  '--muted-foreground': designTokens.colors.neutral[600],
  
  // Card colors
  '--card': designTokens.colors.neutral[50],
  '--card-foreground': designTokens.colors.neutral[900],
  
  // Popover colors
  '--popover': designTokens.colors.neutral[50],
  '--popover-foreground': designTokens.colors.neutral[900],
  
  // Border colors
  '--border': designTokens.colors.neutral[200],
  '--input': designTokens.colors.neutral[200],
  '--ring': designTokens.colors.primary[500],
  
  // State colors
  '--destructive': designTokens.colors.error[500],
  '--destructive-foreground': designTokens.colors.neutral[50],
  '--success': designTokens.colors.success[500],
  '--success-foreground': designTokens.colors.neutral[50],
  '--warning': designTokens.colors.warning[500],
  '--warning-foreground': designTokens.colors.neutral[900],
  
  // Chart colors for analytics
  '--chart-1': designTokens.colors.primary[500],
  '--chart-2': designTokens.colors.secondary[500],
  '--chart-3': designTokens.colors.accent[500],
  '--chart-4': designTokens.colors.success[500],
  '--chart-5': designTokens.colors.warning[500],
  
  // Border radius
  '--radius': designTokens.borderRadius.lg
};

// CSS variables mapping for dark theme
export const darkThemeVars = {
  '--background': designTokens.colors.neutral[950],
  '--foreground': designTokens.colors.neutral[50],
  
  '--primary': designTokens.colors.primary[400],
  '--primary-foreground': designTokens.colors.neutral[900],
  '--primary-muted': designTokens.colors.primary[950],
  
  '--secondary': designTokens.colors.neutral[800],
  '--secondary-foreground': designTokens.colors.neutral[50],
  
  '--accent': designTokens.colors.neutral[800],
  '--accent-foreground': designTokens.colors.neutral[50],
  
  '--muted': designTokens.colors.neutral[800],
  '--muted-foreground': designTokens.colors.neutral[400],
  
  '--card': designTokens.colors.neutral[900],
  '--card-foreground': designTokens.colors.neutral[50],
  
  '--popover': designTokens.colors.neutral[900],
  '--popover-foreground': designTokens.colors.neutral[50],
  
  '--border': designTokens.colors.neutral[800],
  '--input': designTokens.colors.neutral[800],
  '--ring': designTokens.colors.primary[400],
  
  '--destructive': designTokens.colors.error[600],
  '--destructive-foreground': designTokens.colors.neutral[50],
  '--success': designTokens.colors.success[600],
  '--success-foreground': designTokens.colors.neutral[50],
  '--warning': designTokens.colors.warning[600],
  '--warning-foreground': designTokens.colors.neutral[900],
  
  '--chart-1': designTokens.colors.primary[400],
  '--chart-2': designTokens.colors.secondary[400], 
  '--chart-3': designTokens.colors.accent[400],
  '--chart-4': designTokens.colors.success[600],
  '--chart-5': designTokens.colors.warning[600],
  
  '--radius': designTokens.borderRadius.lg
};