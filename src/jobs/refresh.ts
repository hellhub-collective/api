import { CronJob } from "cron";

import RequestCache from "classes/request-cache";
import { refreshAndStoreSourceData } from "utils/refresh";

new CronJob(
  "0 */1 * * * *",
  async () => {
    const startDate = Date.now();
    try {
      console.log("Refreshing source data");

      await refreshAndStoreSourceData();
      RequestCache.flushAll();

      const endDate = Date.now();
      console.log(`Source data refreshed in ${endDate - startDate}ms`);
    } catch (err: any) {
      const endDate = Date.now();
      console.error(`Error refreshing source data in ${endDate - startDate}ms`);
      console.error(err);
    }
  },
  null,
  true,
  "Europe/Zurich",
);
