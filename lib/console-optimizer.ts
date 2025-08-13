// Production console optimization
// Only show logs in development
export const logger = {
  log: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(...args)
    }
  },
  error: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(...args)
    }
  },
  warn: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.warn(...args)
    }
  },
  info: (...args: any[]) => {
    if (process.env.NODE_ENV === 'development') {
      console.info(...args)
    }
  },
}

// Performance monitoring utilities
export const performanceMonitor = {
  start: (label: string) => {
    if (process.env.NODE_ENV === 'development') {
      performance.mark(`${label}-start`)
    }
  },
  end: (label: string) => {
    if (process.env.NODE_ENV === 'development') {
      performance.mark(`${label}-end`)
      performance.measure(label, `${label}-start`, `${label}-end`)
      const measure = performance.getEntriesByName(label)[0]
      console.log(`⚡ ${label}: ${measure.duration.toFixed(2)}ms`)
    }
  },
}