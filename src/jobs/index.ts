import chalk from "chalk";
import { Cron } from "croner";
import * as Sentry from "@sentry/bun";

import RequestCache from "classes/request-cache";
import { refreshAndStoreSourceData } from "utils/refresh";

export const refresh_from_source = Cron("0 */1 * * * *", async () => {
  const startDate = Date.now();
  const monitorSlug = "refresh-from-source-data";

  // start a check-in with sentry
  let checkInId = (() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!process.env.SENTRY_DSN) return;
    return Sentry.captureCheckIn({ monitorSlug, status: "in_progress" });
  })();

  try {
    await refreshAndStoreSourceData();
    RequestCache.flushAll();

    console.log(
      `${chalk.bold(chalk.magenta("CRON"))} Refreshed source data ${`(${Date.now() - startDate}ms)`}`,
    );

    // send the cron check-in result to sentry
    if (!checkInId) return;
    Sentry.captureCheckIn({ status: "ok", checkInId, monitorSlug });
  } catch (err: any) {
    Sentry.captureException(err);

    console.error(
      `${chalk.bold(chalk.red("ERROR"))} Error refreshing source data ${`(${Date.now() - startDate}ms)`}`,
      `\n${err}`,
    );

    // send the cron check-in result to sentry
    if (!checkInId) return;
    Sentry.captureCheckIn({
      checkInId,
      status: "error",
      monitorSlug: "refresh-from-source-data",
    });
  }
});
