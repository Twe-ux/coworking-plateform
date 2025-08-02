import pino from 'pino'

// Create logger configuration based on environment
const createLogger = () => {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const logLevel = process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info')

  const config: pino.LoggerOptions = {
    level: logLevel,
    ...(isDevelopment && {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
          translateTime: 'yyyy-mm-dd HH:MM:ss',
        },
      },
    }),
    ...(!isDevelopment && {
      formatters: {
        level: (label) => ({ level: label }),
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    }),
  }

  return pino(config)
}

export const logger = createLogger()

// Utility functions for structured logging
export const createContextLogger = (context: string, metadata?: Record<string, any>) => {
  return logger.child({ context, ...metadata })
}

// Request logging middleware helper
export const logRequest = (method: string, url: string, duration?: number, statusCode?: number) => {
  const logData = {
    method,
    url,
    duration,
    statusCode,
  }

  if (statusCode && statusCode >= 400) {
    logger.error(logData, `${method} ${url} - ${statusCode}`)
  } else {
    logger.info(logData, `${method} ${url} - ${statusCode || 'pending'}`)
  }
}

// Error logging with context
export const logError = (error: Error, context?: string, metadata?: Record<string, any>) => {
  logger.error(
    {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
      context,
      ...metadata,
    },
    `Error occurred${context ? ` in ${context}` : ''}: ${error.message}`
  )
}

// Performance logging
export const logPerformance = (operation: string, duration: number, metadata?: Record<string, any>) => {
  logger.info(
    {
      operation,
      duration,
      ...metadata,
    },
    `Performance: ${operation} took ${duration}ms`
  )
}

export default logger