/** @type {import('tailwindcss').Config} */
module.exports = {
  ...require('./tailwind.base.config.js'),
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
    "../wedsync/src/**/*.{js,ts,jsx,tsx}",
    "../wedme/src/**/*.{js,ts,jsx,tsx}",
    "../admin/src/**/*.{js,ts,jsx,tsx}"
  ]
}