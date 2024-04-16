import * as Sentry from "@sentry/bun";

export const sentryOptions: Sentry.BunOptions = {
  integrations: [],
  tracesSampleRate: 0.6,
  dsn: process.env.SENTRY_DSN,
  release: process.env.KOYEB_GIT_SHA,
  environment: process.env.NODE_ENV ?? "development",
  tracePropagationTargets: [
    "localhost",
    /^https:\/\/api-hellhub-collective\.koyeb\.app\/api/,
  ],
};

export function initSentry(): void {
  if (process.env.NODE_ENV !== "production") return;
  if (!process.env.SENTRY_DSN) return;
  Sentry.init(sentryOptions);
}
