// backend/jobs/liveEventScheduler.js
const cron = require("node-cron");

module.exports = function startLiveScheduler(liveEvent) {
  // Every day at 7:00 PM IST
  cron.schedule(
    "0 19 * * *",
    () => {
      console.log("[LIVE] Starting daily live event");
      liveEvent.startSession();
    },
    { timezone: "Asia/Kolkata" }
  );
};
