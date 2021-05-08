const socket = io();

// escuchar
socket.on("logout", () => {
  document.location.replace("/");
});

// If the user logout, the socket
// emit a loggout event
const emitLogout = () => {
  socket.emit("logout");
};
