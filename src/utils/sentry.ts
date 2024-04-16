import * as Sentry from "@sentry/node";

/**
 * Capture an exception and log it to the console, if no DSN is provided,
 * it will not be sent to Sentry.
 */
export default function captureException(
  error: Error,
  log: boolean = process.env.NODE_ENV !== "production",
): void {
  if (log) console.error(error);
  if (!process.env.SENTRY_DSN) return;
  if (process.env.NODE_ENV !== "production") return;
  Sentry.captureException(error);
}

/**
 * Initialize Sentry with the provided DSN, if no DSN is provided, it will
 * not be enabled. By the default, it will not be enabled in development as
 * well.
 */
export function initSentry(): void {
  if (process.env.NODE_ENV !== "production") return;
  if (!process.env.SENTRY_DSN) return;
  Sentry.init({
    integrations: [],
    tracesSampleRate: 0.6,
    dsn: process.env.SENTRY_DSN,
    release: process.env.KOYEB_GIT_SHA,
    environment: process.env.NODE_ENV ?? "development",
    tracePropagationTargets: [
      "localhost",
      /^https:\/\/api-hellhub-collective\.koyeb\.app\/api/,
    ],
  });
}
