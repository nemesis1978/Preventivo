import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}', // For Next.js App Router
    './app/**/*.{js,ts,jsx,tsx,mdx}', // Common alternative for App Router
  ],
  darkMode: 'class', // or 'media'
  theme: {
    extend: {
      // You can extend your theme here
      // For example, define dark mode specific colors if needed
      // colors: {
      //   dark: {
      //     background: '#1a202c',
      //     text: '#e2e8f0',
      //   }
      // }
    },
  },
  plugins: [],
};

export default config;