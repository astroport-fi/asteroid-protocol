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
      '2': 'repeat(2, minmax(0, 1fr))',
      '3': 'repeat(3, minmax(0, 1fr))',
      '4': 'repeat(4, minmax(0, 1fr))',
      'fill-10': 'repeat(auto-fill, minmax(10rem, 1fr))',
      'fill-56': 'repeat(auto-fill, minmax(14rem, 1fr))',
      'fill-64': 'repeat(auto-fill, minmax(16rem, 1fr))',
    },
    extend: {
      colors: {
        'header-content': '#929292',
      },
      backgroundImage: {
        'main-gradient':
          'linear-gradient(251.43deg, #151515 17.97%, #1E1E1E 43.41%, #303030 51.83%, #1E1E1E 58.81%, #151515 87.04%)',
      },
      fontFamily: {
        heading: ['PixelifySans-Variable', 'sans-serif'],
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
      mono: ['Fira Code', 'monospace'],
    },
  },
  daisyui: {
    themes: [
      {
        mytheme: {
          primary: '#21EED1',
          secondary: '#F03AA9',
          accent: '#21EED1',
          neutral: '#d7d8da',
          'base-100': '#383E46',
          'base-200': '#4b5158',
          'base-300': '#5f646a',
          success: '#ADE25D',
          error: '#F95200',
        },
      },
    ],
  },
  plugins: [daisyui, typography],
} satisfies Config
