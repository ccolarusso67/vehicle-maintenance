/**
 * Error monitoring setup.
 *
 * To enable Sentry:
 * 1. npm install @sentry/nextjs
 * 2. Set NEXT_PUBLIC_SENTRY_DSN in environment
 * 3. Uncomment the init call below
 *
 * For now, errors are logged to console only.
 */

// import * as Sentry from '@sentry/nextjs';

export function initMonitoring(): void {
  // const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  // if (dsn) {
  //   Sentry.init({ dsn, tracesSampleRate: 0.1 });
  // }
}

export function captureError(error: Error, context?: Record<string, unknown>): void {
  console.error('[Monitor]', error.message, context);
  // if (typeof Sentry !== 'undefined') {
  //   Sentry.captureException(error, { extra: context });
  // }
}
