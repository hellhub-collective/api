import * as Sentry from "@sentry/bun";

import { db } from "utils/database";

export const sentryOptions: Sentry.BunOptions = {
  tracesSampleRate: 0.3,
  dsn: process.env.SENTRY_DSN,
  release: process.env.KOYEB_GIT_SHA,
  environment: process.env.NODE_ENV ?? "development",
  integrations: [
    new Sentry.Integrations.Http(),
    new Sentry.Integrations.Undici(),
    new Sentry.Integrations.Console(),
    new Sentry.Integrations.RequestData(),
    new Sentry.Integrations.Prisma({ client: db }),
  ],
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
