import chalk from "chalk";
import { CronJob } from "cron";
import * as Sentry from "@sentry/bun";

import captureException from "utils/sentry";
import RequestCache from "classes/request-cache";
import { refreshAndStoreSourceData } from "utils/refresh";

new CronJob(
  "0 */1 * * * *",
  async () => {
    // start a check-in with sentry
    let checkInId = (() => {
      if (process.env.NODE_ENV !== "production") return;
      if (!process.env.SENTRY_DSN) return;
      return Sentry.captureCheckIn({
        monitorSlug: "refresh-from-source-data",
        status: "in_progress",
      });
    })();

    const startDate = Date.now();
    try {
      await refreshAndStoreSourceData();
      RequestCache.flushAll();

      console.log(
        `${chalk.bold(chalk.magenta("CRON"))} Refreshed source data ${`(${Date.now() - startDate}ms)`}`,
      );

      // send the cron check-in result to sentry
      if (checkInId) {
        Sentry.captureCheckIn({
          checkInId,
          status: "ok",
          monitorSlug: "refresh-from-source-data",
        });
      }
    } catch (err: any) {
      captureException(err, false);

      // send the cron check-in result to sentry
      if (checkInId) {
        Sentry.captureCheckIn({
          checkInId,
          status: "error",
          monitorSlug: "refresh-from-source-data",
        });
      }

      console.error(
        `${chalk.bold(chalk.red("ERROR"))} Error refreshing source data ${`(${Date.now() - startDate}ms)`}`,
        `\n${err}`,
      );
    }
  },
  null,
  true,
  "Europe/Zurich",
);
