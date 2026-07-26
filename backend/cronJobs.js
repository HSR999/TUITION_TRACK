const cron = require("node-cron");
const { runDueReminderJob } = require("./services/reminderService");

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
};

module.exports = startCronJobs;
