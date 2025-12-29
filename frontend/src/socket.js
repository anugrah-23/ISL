// frontend/src/socket.js
import { io } from "socket.io-client";

let socket = null;

export function getSocket(currentUser) {
  if (socket) return socket;

  const envUrl = process.env.REACT_APP_SOCKET_URL;
  const defaultPort = process.env.REACT_APP_BACKEND_PORT || "5000";
  const url =
    envUrl ||
    `${window.location.protocol}//${window.location.hostname}:${defaultPort}`;

  socket = io(url, {
    transports: ["websocket", "polling"],
    autoConnect: true,
  });

  socket.on("connect", () => {
    console.debug("[socket] connected", socket.id);

    if (currentUser?.id) {
      socket.emit("friend:register", { userId: currentUser.id });
    }
  });

  socket.on("connect_error", (err) =>
    console.error("[socket] connect_error", err?.message || err)
  );

  socket.on("disconnect", (reason) =>
    console.debug("[socket] disconnected", reason)
  );

  return socket;
}
