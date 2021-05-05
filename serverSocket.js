const socketIO = require("socket.io");
const sharedSession = require("express-socket.io-session");

const Chatroom = require("./models/chatroom");

const ConnectedUsers = require("./socketClasses/connected-users");

const connectedUsers = new ConnectedUsers();

module.exports = (server, sessionMiddleware) => {
  /**
   * Create Socket IO server on the top of the http server.
   */
  const io = socketIO(server);

  // This io middleware sync the req.session object with
  // the socketClient.handshake.session object in order to share
  // the same session between express and socket.io.
  // The Id of the session at the mongo store can be found
  // as the socketClient.handshake.sessionID
  io.use(sharedSession(sessionMiddleware), { autoSave: true });

  /*
* La idea ahora es enviarle un mensaje a los sockets 
del mismo usuario que se encuentran en el mismo canal 
para que recarguen sus pestañas.
*/

  io.on("connection", socketClient => {
    //Store all active connections for a given user
    // const sessionID = (socketClient.sessionID = socketClient.handshake.sessionID);
    // const username = (socketClient.username =
    //   socketClient.handshake.session.username);
    const sessionID = socketClient.handshake.sessionID;
    const username = socketClient.handshake.session.username;

    socketClient.join(sessionID);

    socketClient.on("chatEntering", () => {
      if (!connectedUsers.getUser(sessionID)) {
        // Just add new sessions to the connected Users list
        connectedUsers.addUser(sessionID, username);
        socketClient.broadcast.emit(
          "actualUsers",
          connectedUsers.getAllUsers()
        );
      }
    });

    // socketClient.on("roomJoinedSuccessfully", () => {
    //   if (!connectedUsers.getUser(sessionID)) {
    //     // Just add new sessions to the connected Users list
    //     connectedUsers.addUser(sessionID, username);
    //     socketClient.broadcast.emit("actualUsers", connectedUsers.getAllUsers());
    //   }
    // });

    socketClient.on("disconnect", async () => {
      socketClient.to(sessionID).emit("checkLogout");

      // get all sockets for a given session
      const matchingSockets = await io.in(sessionID).allSockets();
      // check if all sockets are closes for a given session
      const isDisconnected = matchingSockets.size === 0;
      console.log("total socket in session channel: ", matchingSockets.size);
      if (isDisconnected) {
        // notify other users about the user disconnection
        socketClient.broadcast.emit("sendMessage", {
          user: "SERVER",
          message: `${username} left the chat`,
        });
        connectedUsers.removeUser(sessionID);
        console.log("El usuario se ha desconectado");
      }
    });

    socketClient.on("privateMessage", data => {
      // Chatroom.findOne({name: chatroom}).then(chatroomDoc => {
      //   chatroomDoc.messages.push({userId: userId, message: data.message, date: Date.now()});
      //   chatroomDoc.save()
      // })
      socketClient.to(data.user).to(sessionID).emit("privateMessage", {
        username,
        message: data.message,
      });
    });
  });
};
