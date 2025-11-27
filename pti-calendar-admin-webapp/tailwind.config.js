/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './node_modules/@pti-calendar/design-system/src/**/*.{js,ts,jsx,tsx}',
  ],
  presets: [require('@pti-calendar/design-system/tailwind.config.js')],
  theme: { extend: {} },
  plugins: [],
};
