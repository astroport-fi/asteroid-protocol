import typography from '@tailwindcss/typography'
import daisyui from 'daisyui'
import type { Config } from 'tailwindcss'

export default {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    'node_modules/daisyui/dist/**/*.js',
    'node_modules/react-daisyui/dist/**/*.js',
  ],
  theme: {
    gridTemplateColumns: {
      'fill-56': 'repeat(auto-fill, minmax(14rem, 1fr))',
    },
    extend: {
      colors: {
        'header-content': '#929292',
      },
      backgroundImage: {
        'main-gradient':
          'linear-gradient(251.43deg, #151515 17.97%, #1E1E1E 43.41%, #303030 51.83%, #1E1E1E 58.81%, #151515 87.04%)',
      },
    },
    fontFamily: {
      sans: [
        'Poppins-VariableFont_wght',
        'ui-sans-serif',
        'system-ui',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        '"Noto Sans"',
        'sans-serif',
        '"Apple Color Emoji"',
        '"Segoe UI Emoji"',
        '"Segoe UI Symbol"',
        '"Noto Color Emoji"',
      ],
    },
  },
  daisyui: {
    themes: [
      {
        mytheme: {
          primary: '#EBB348',
          secondary: '#E47286',
          accent: '#57AAA7',
          neutral: '#303030',
          'base-100': '#151515',
          'base-200': '#212121',
          'base-300': '#2c2c2c',
          success: '#ADE25D',
          error: '#F95200',
        },
      },
    ],
  },
  plugins: [daisyui, typography],
} satisfies Config
