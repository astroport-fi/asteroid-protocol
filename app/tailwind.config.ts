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
    extend: {},
  },
  plugins: [daisyui, typography],
} satisfies Config
