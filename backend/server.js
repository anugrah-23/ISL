require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// shared state
const onlineUsers = new Map();

app.use(cors());
app.use(express.json());

// ---- SOCKET.IO ----
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});
app.set("io", io);

/**
 * ======================================================
 * TYPE A SOCKET MODULES
 * (self-registering via io.on("connection"))
 * ======================================================
 */
require("./sockets/duel")(io);
// ❌ DO NOT enable this — causes duplicate matches
// require("./sockets/matchmaker")(io);

/**
 * ======================================================
 * PER-SOCKET CONNECTION HANDLER
 * ======================================================
 */
io.on("connection", (socket) => {
  console.log("[socket] connected", socket.id);

  /**
   * ==================================================
   * TYPE B SOCKET MODULES
   * (expect socket object)
   * ==================================================
   */
  require("./sockets/friendMatch")(io, socket, onlineUsers);
  require("./sockets/games")(io, socket);
  require("./sockets/battles")(io, socket);
  require("./sockets/liveEvent")(io, socket);
});

// ---- ROUTES ----
app.get("/", (_, res) => res.send("ISL Backend OK"));

app.use("/api/auth", require("./routes/auth"));
app.use("/api/duel", require("./routes/duel")); // ✅ REST matchmaker
app.use("/api/games", require("./routes/games"));
app.use("/api/battles", require("./routes/battles"));
app.use("/api/content", require("./routes/content"));
app.use("/api/courses", require("./routes/courses"));
app.use("/api/users", require("./routes/users"));
app.use("/api/videos", require("./routes/videos"));
app.use("/api/stories", require("./routes/stories"));
app.use("/api/reminders", require("./routes/reminders"));
app.use("/api/achievements", require("./routes/achievements"));
app.use("/api/friends", require("./routes/friends"));

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
