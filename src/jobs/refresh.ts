import { CronJob } from "cron";
import Cache from "memory-cache";

import { refreshAndStoreSourceData } from "utils/refresh";

new CronJob(
  "0 */30 * * * *",
  async () => {
    const startDate = Date.now();
    console.log("Refreshing source data");
    await refreshAndStoreSourceData();
    Cache.clear();
    const endDate = Date.now();
    console.log(`Source data refreshed in ${endDate - startDate}ms`);
  },
  null,
  true,
  "Europe/Zurich",
);
