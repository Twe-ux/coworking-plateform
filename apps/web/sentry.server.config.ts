import * as Sentry from "@sentry/nextjs"

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn: SENTRY_DSN,
  debug: false,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.Http({ tracing: true }),
  ],
  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  // Release tracking
  release: process.env.npm_package_version,
  beforeSend(event, hint) {
    // Add custom logic here to filter events
    if (process.env.NODE_ENV === "development") {
      console.log("Sentry server event:", event)
    }
    return event
  },
})