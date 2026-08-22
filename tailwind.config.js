/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cream: '#FDFBF7',
        beige: '#F5F2EB',
        charcoal: '#222222',
        muted: '#666666',
        terracotta: {
          DEFAULT: '#C85A32',
          hover: '#B04A25',
          soft: '#FBF2ED'
        },
        neutralborder: '#E8E3D9'
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        serif: ['"Space Grotesk"', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'sans-serif']
      }
    },
  },
  plugins: [],
}
