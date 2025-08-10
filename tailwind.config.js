/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  // Tailwind v4 uses CSS-first configuration, so most theme config is in globals.css
  theme: {},
  safelist: [
    // Gradients pour les couleurs d'espaces
    'from-coffee-primary',
    'to-coffee-accent',
    'from-amber-400',
    'to-orange-500',
    'from-emerald-400',
    'to-teal-500',
    'from-blue-400',
    'to-purple-500',
    'from-pink-400',
    'to-rose-500',
    'from-indigo-400',
    'to-blue-500',
    'from-green-400',
    'to-emerald-500',
    'from-purple-400',
    'to-pink-500',
    'from-yellow-400',
    'to-amber-500',
    'from-cyan-400',
    'to-blue-500',
    'bg-gradient-to-br'
  ]
}