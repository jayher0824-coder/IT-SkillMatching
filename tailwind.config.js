/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './client/public/admin.html',
    './client/public/admin/**/*.{js,jsx}',
    './client/public/**/*.html'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#56AE67',
        'primary-dark': '#3d8b4f'
      }
    },
  },
  plugins: [],
}
