import chalk from "chalk";
import { CronJob } from "cron";

import RequestCache from "classes/request-cache";
import { refreshAndStoreSourceData } from "utils/refresh";

new CronJob(
  "0 */1 * * * *",
  async () => {
    const startDate = Date.now();
    try {
      await refreshAndStoreSourceData();
      RequestCache.flushAll();
      console.log(
        `${chalk.bold(chalk.magenta("CRON"))} Refreshed source data ${`(${Date.now() - startDate}ms)`}`,
      );
    } catch (err: any) {
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
