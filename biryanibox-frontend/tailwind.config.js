/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#f59e0b',
          hover: '#d97706',
        },
        secondary: {
          DEFAULT: '#1a1a1a',
          light: '#2a2a2a',
        },
        'bg-main': '#1a1a1a',
        'bg-offset': '#222222',
        'text-muted': '#a0a0a0',
        'text-main': '#fdfdfd',
      },
      fontFamily: {
        heading: ['Playfair Display', 'serif'],
        body: ['Inter', 'sans-serif'],
        serif: ['Playfair Display', 'serif'],
      },
      boxShadow: {
        '3xl': '0 35px 60px -15px rgba(0, 0, 0, 0.5)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};
