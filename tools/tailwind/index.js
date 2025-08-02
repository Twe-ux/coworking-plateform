// Tailwind CSS v4 - Simplified config for legacy compatibility
/** @type {import('tailwindcss').Config} */
module.exports = {
  // v4 uses CSS-first approach, this config is minimal
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    '../../packages/ui/**/*.{ts,tsx}',
  ],
  
  // Import the CSS-first theme from base.css
  theme: {
    // Minimal theme extension for compatibility
    extend: {}
  },
  
  // Reduced plugins for v4 compatibility
  plugins: [],
}