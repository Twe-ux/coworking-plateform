/**
 * Animation utilities for client dashboard components
 * Using Framer Motion for smooth, café-themed animations
 */

import { Variants } from 'framer-motion'

// Animation variants pour les cartes
export const cardVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: 20, 
    scale: 0.95 
  },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut"
    }
  },
  hover: {
    scale: 1.02,
    y: -5,
    transition: {
      duration: 0.2,
      ease: "easeInOut"
    }
  }
}

// Animation pour le container principal
export const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      delayChildren: 0.1,
      staggerChildren: 0.1
    }
  }
}

// Animation pour les éléments de navigation
export const navItemVariants: Variants = {
  hidden: { 
    opacity: 0, 
    x: -10 
  },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  hover: {
    x: 5,
    transition: {
      duration: 0.2,
      ease: "easeInOut"
    }
  }
}

// Animation pour le header avec effet de souffle de café
export const headerVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: -30,
    scale: 0.9
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
}

// Animation pour les statistiques avec compteur
export const statsVariants: Variants = {
  hidden: { 
    opacity: 0,
    scale: 0.8,
    y: 15
  },
  visible: { 
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "backOut",
      delay: 0.2
    }
  }
}

// Animation pour les actions rapides
export const quickActionVariants: Variants = {
  hidden: { 
    opacity: 0,
    scale: 0.9,
    rotate: -5
  },
  visible: { 
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: {
      duration: 0.5,
      ease: "backOut"
    }
  },
  hover: {
    scale: 1.05,
    rotate: 1,
    transition: {
      duration: 0.2,
      ease: "easeInOut"
    }
  },
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1
    }
  }
}

// Animation pour les éléments de liste
export const listItemVariants: Variants = {
  hidden: { 
    opacity: 0, 
    x: -20,
    scale: 0.95
  },
  visible: { 
    opacity: 1, 
    x: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  },
  hover: {
    x: 10,
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: "easeInOut"
    }
  }
}

// Animation pour l'effet de chargement type "vapeur de café"
export const loadingVariants: Variants = {
  animate: {
    scale: [1, 1.1, 1],
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}

// Animation pour les badges/notifications
export const badgeVariants: Variants = {
  hidden: { 
    scale: 0,
    opacity: 0
  },
  visible: { 
    scale: 1,
    opacity: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 20
    }
  },
  pulse: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 0.8,
      repeat: Infinity,
      ease: "easeInOut"
    }
  }
}

// Animation pour l'entrée de la sidebar
export const sidebarVariants: Variants = {
  hidden: {
    x: -300,
    opacity: 0
  },
  visible: {
    x: 0,
    opacity: 1,
    transition: {
      duration: 0.5,
      ease: "easeOut",
      staggerChildren: 0.1,
      delayChildren: 0.2
    }
  }
}

// Animation pour l'effet de transition des pages
export const pageTransitionVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: "easeIn"
    }
  }
}

// Utilitaires pour les délais d'animation
export const getStaggerDelay = (index: number, baseDelay: number = 0.1) => 
  baseDelay * index

// Animation pour l'effet coffee steam
export const coffeeStreamVariants: Variants = {
  animate: {
    y: [0, -10, 0],
    opacity: [0.3, 0.7, 0.3],
    scale: [1, 1.05, 1],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: "easeInOut",
      repeatDelay: 1
    }
  }
}