const socketIO = require("socket.io");
const sharedSession = require("express-socket.io-session");

const ChatroomUsers = require("./socketClasses/chatroom-users");

const chatRoomsData = [
  {
    name: "MongoDB",
    imageUrl:
      "https://infinapps.com/wp-content/uploads/2018/10/mongodb-logo.png",
  },
  {
    name: "ExpressJS",
    imageUrl:
      "https://manticore-labs.com/wp-content/uploads/2019/02/express.png",
  },
  {
    name: "ReactJS",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/React.svg/800px-React.svg.png",
  },
  {
    name: "NodeJS",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Node.js_logo.svg/590px-Node.js_logo.svg.png",
  },
  {
    name: "MERN",
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/MERN-logo.png/800px-MERN-logo.png",
  },
  {
    name: "Socket.io",
    imageUrl:
      "https://image.codeforgeek.com/wp-content/uploads/2018/11/socket.io_.png",
  },
];

/**
 * Create/Restore Chatrooms when the server is launched.
 */

const chatRooms = new ChatroomUsers();

//Seed the database
chatRoomsData.forEach(room => chatRooms.addNewRoom(room));

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

  io.on("connection", socketClient => {
    const url = socketClient.handshake.headers.referer;
    const username = socketClient.handshake.session.username;
    const sessionID = socketClient.handshake.sessionID;

    //Maintain all sockets of a user in the same chanel in order
    //notify the rest of its sockets when the user logout
    socketClient.join(sessionID);
    //In case of logout, emit this to all user sockets
    socketClient.on("logout", () => {
      socketClient.to(sessionID).emit("logout");
    });

    //URL has to have a room name to join the socket to an
    //specific room
    if (url.includes("room")) {
      const roomName = url.split("/").pop();
      //Date string with format "d/m/yy hh:mm"(6/5/21 15:13)
      let messageDate = new Date().toLocaleString("default", {
        dateStyle: "short",
        timeStyle: "short",
      });

      //Join the user socket to the corresponding chanel
      socketClient.join(roomName);

      //Join the user socket to its own room-username chanel
      //This will allow me to handle the disconnection when
      //the same user is connected to the same room using
      //different browser tabs (each tab use a differnt socket).
      socketClient.join(`${roomName}${username}`);

      //Add the user to the list of online users of the given
      //room and notify the rest of the users in the room.
      //In case the use has been previously added, its name
      //is not added to the list of online users and the
      //notification is not sent.
      if (chatRooms.addUserToChatroom(roomName, username)) {
        const roomMessage = { username, messageDate };
        // notify other users about the user connection
        socketClient.to(roomName).emit("addOnlineUser", roomMessage);
      }

      //Listening for incomming room messages
      socketClient.on("privateMessage", message => {
        //Date string with format "d/m/yy hh:mm"(6/5/21 15:13)
        let messageDate = new Date().toLocaleString("default", {
          dateStyle: "short",
          timeStyle: "short",
        });
        const roomMessage = { username, message, messageDate };
        //Sent the incoming message to the room
        socketClient.to(roomName).emit("privateMessage", roomMessage);
        //Store the message in the database
        chatRooms.addNewMessage(roomName, roomMessage);
      });

      socketClient.on("disconnect", async () => {
        // get all sockets of a user for a given room
        const matchingSockets = await io
          .in(`${roomName}${username}`)
          .allSockets();
        // check if all user sockets for a given room are closed.
        const isDisconnected = matchingSockets.size === 0;
        if (isDisconnected) {
          //Date string with format "d/m/yy hh:mm"(6/5/21 15:13)
          let messageDate = new Date().toLocaleString("default", {
            dateStyle: "short",
            timeStyle: "short",
          });
          const roomMessage = { username, messageDate };
          // notify other users about the user disconnection
          socketClient.to(roomName).emit("removeOnlineUser", roomMessage);
          //Remove user from onlineUser list in the database
          chatRooms.removeUserFromChatroom(roomName, username);
        }
      });
    }
  });
};
