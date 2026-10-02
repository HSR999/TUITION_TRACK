const cron = require("node-cron");
const { runDueReminderJob } = require("./services/reminderService");
const { runDailyFeePushJob } = require("./services/pushNotificationService");

const startCronJobs = () => {
  cron.schedule(
    "0 8 * * *",
    async () => {
      try {
        await runDueReminderJob();
        console.log("Daily fee reminder job completed");
      } catch (error) {
        console.error(`Fee reminder job failed: ${error.message}`);
      }
    },
    { timezone: "Asia/Kolkata" }
  );

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
