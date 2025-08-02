/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    './.storybook/**/*.{js,ts,jsx,tsx}',
    './src/**/*.stories.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        blue: {
          10: '#F5F6F9',
          30: '#39508E',
          50: '#0E2975',
        },
        gray: {
          30: '#747474',
          50: '#C9C9C9',
          70: '#575757',
          90: '#6A6A6A',
        },
        white: {
          50: '#ffffff',
          70: '#FCFCFC',
        },
      },
      fontFamily: {
        pretendard: ['var(--font-pretendard)'],
      },
      fontSize: {
        headline1: [
          '45px',
          {
            lineHeight: '140%',
            letterSpacing: '-0.02em',
          },
        ],
        headline2: [
          '40px',
          {
            lineHeight: '140%',
            letterSpacing: '-0.02em',
          },
        ],
        headline3: [
          '30px',
          {
            lineHeight: '140%',
            letterSpacing: '-0.02em',
          },
        ],
        subtitle: [
          '25px',
          {
            lineHeight: '140%',
            letterSpacing: '-0.02em',
          },
        ],
        subtitle2: [
          '20px',
          {
            lineHeight: '140%',
            letterSpacing: '-0.02em',
          },
        ],
      },
      boxShadow: {
        'custom-black': '4px 4px 4px rgba(0, 0, 0, 0.25)',
      },
    },
  },
  plugins: [],
};
