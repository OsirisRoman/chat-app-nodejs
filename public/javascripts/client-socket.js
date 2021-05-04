const socket = io();

socket.on("connect", () => {
  console.log("Connected to server");

  socket.emit("chatEntering");
});

// escuchar
socket.on("checkLogout", () => {
  window.location.reload();
  console.log("refreshing the tab");
});

// // Enviar información
// socket.emit(
//   "enviarMensaje",
//   {
//     usuario: "Fernando",
//     mensaje: "Hola Mundo",
//   },
//   function (resp) {
//     console.log("respuesta server: ", resp);
//   }
// );

// Listening for incomming messages
socket.on("sendMessage", function (message) {
  console.log("Server Message Received: ", message);
});

// Listening for incomming messages
socket.on("privateMessage", function (message) {
  console.log("Private Message Received: ", message);
});

//Listening for new connections or disconnections.
socket.on("actualUsers", function (userList) {
  console.log("Actual List of Users: ", userList);
});
