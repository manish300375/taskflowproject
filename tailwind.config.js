/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        sage: '#7BAE7F',
        cream: '#FFF8F0',
        charcoal: '#2D2D2D',
        coral: '#FF8C69',
        mutedGray: '#6B7280',
        softRed: '#EF4444',
      },
      fontFamily: {
        sans: ['Nunito', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        button: '12px',
      },
      boxShadow: {
        soft: '0 4px 20px rgba(0, 0, 0, 0.08)',
      },
    },
  },
  plugins: [],
};
