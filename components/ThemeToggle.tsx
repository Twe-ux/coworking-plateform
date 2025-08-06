'use client'

export default function ThemeToggle() {
  // Theme toggle is temporarily disabled
  // Return null to hide the component entirely
  return null

  /* 
  // This code is preserved for potential future re-enabling
  const { theme, toggleTheme } = useThemeSafe()

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative p-3 rounded-full bg-coffee-muted/20 hover:bg-coffee-muted/30 transition-all duration-300 shadow-lg hover:shadow-xl"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={`Passer au mode ${theme === 'light' ? 'sombre' : 'clair'}`}
    >
      <div className="absolute inset-0 rounded-full bg-linear-to-br from-coffee-primary/10 to-coffee-accent/10 opacity-50" />
      
      <motion.div
        initial={false}
        animate={{ rotate: theme === 'dark' ? 180 : 0 }}
        transition={{ duration: 0.4, ease: "easeInOut" }}
        className="relative z-10"
      >
        <Sun className="w-5 h-5 text-coffee-accent drop-shadow-sm" />
      </motion.div>
    </motion.button>
  )
  */
}
