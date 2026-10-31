const cron = require("node-cron");
const { runDailyFeePushJob } = require("./services/pushNotificationService");

const startCronJobs = () => {
  cron.schedule(
    "0 8 * * *",
    async () => {
      try {
        await runDailyFeePushJob();
      } catch (error) {
        console.error(`Daily phone notification job failed: ${error.message}`);
      }
    },
    { timezone: "Asia/Kolkata" }
  );
};

module.exports = startCronJobs;
