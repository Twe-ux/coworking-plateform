import * as Sentry from "@sentry/nextjs"

const SENTRY_DSN = process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN

Sentry.init({
  dsn: SENTRY_DSN,
  debug: false,
  environment: process.env.NODE_ENV,
  integrations: [
    new Sentry.BrowserTracing({
      // Set sampling rate for performance monitoring
      tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
    }),
  ],
  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  // Release tracking
  release: process.env.npm_package_version,
  beforeSend(event, hint) {
    // Filter out known issues in development
    if (process.env.NODE_ENV === "development") {
      console.log("Sentry event:", event)
    }
    return event
  },
})