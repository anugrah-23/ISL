// backend/sockets/liveEvent.js

module.exports = function initLiveEvent(io) {
  /**
   * Compute next 7:00 PM (server local time)
   */
  function getNext7PM() {
    const now = new Date();
    const target = new Date();

    target.setHours(19, 0, 0, 0); // 7:00:00 PM

    // If already past 7 PM today → schedule tomorrow
    if (now >= target) {
      target.setDate(target.getDate() + 1);
    }

    return target.getTime();
  }

  // -----------------------------
  // LIVE EVENT STATE
  // -----------------------------
  const liveState = {
    running: false,
    startsAt: getNext7PM(),
  };

  // -----------------------------
  // EMIT STATUS
  // -----------------------------
  function emitStatus() {
    io.to("live-global").emit("live:status", {
      running: liveState.running,
      startsAt: liveState.startsAt,
      serverTime: Date.now(),
    });
  }

  // -----------------------------
  // SCHEDULER LOOP
  // -----------------------------
  function schedulerLoop() {
    const now = Date.now();

    // Quiz should start
    if (!liveState.running && now >= liveState.startsAt) {
      liveState.running = true;

      emitStatus();
      io.to("live-global").emit("live:start");

      console.log("[live] Quiz started");
    }

    // Reset for next day (after quiz is over)
    if (liveState.running) {
      const nextStart = getNext7PM();
      if (now < nextStart - 23 * 60 * 60 * 1000) {
        // still same day → do nothing
        return;
      }

      liveState.running = false;
      liveState.startsAt = nextStart;

      emitStatus();
      console.log("[live] Quiz scheduled for next day");
    }
  }

  // Run scheduler every second
  setInterval(schedulerLoop, 1000);

  // -----------------------------
  // SOCKET HANDLERS
  // -----------------------------
  io.on("connection", (socket) => {
    console.log("[live] socket connected:", socket.id);

    socket.on("live:join", ({ user }) => {
      socket.join("live-global");

      // Immediately send status
      socket.emit("live:status", {
        running: liveState.running,
        startsAt: liveState.startsAt,
        serverTime: Date.now(),
      });
    });

    socket.on("disconnect", () => {
      console.log("[live] socket disconnected:", socket.id);
    });
  });
};
