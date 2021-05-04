const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
const http = require("http");
const socketio = require("socket.io");
sharedSession = require("express-socket.io-session");

const ConnectedUsers = require("./socketClasses/connected-users");

const indexRouter = require("./routes/index");
const authRoutes = require("./routes/auth");

/**
 * Database connection.
 */

const connect = require("./utils/dbConnection");
const User = require("./models/user");
const { MONGODB_URI } = require("./constants");

const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "sessions",
});

const sessionMiddleware = session({
  secret: "my secret",
  resave: false,
  saveUninitialized: false,
  store,
});

const app = express();

/**
 * Create HTTP server.
 */

const server = http.createServer(app);

/**
 * Create Socket IO server on the top of the http server.
 */

const io = socketio(server);

const csfrProtection = csrf();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(sessionMiddleware);
// This io middleware sync the req.session object with
// the socketClient.handshake.session object in order to share
// the same session between express and socket.io.
// The Id of the session at the mongo store can be found
// as the socketClient.handshake.sessionID
io.use(sharedSession(sessionMiddleware), { autoSave: true });

app.use(csfrProtection);
app.use(flash());

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use("/", indexRouter);
app.use(authRoutes);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  res.status(404).render("404NotFound", {
    pageTitle: "404 Not Found",
    path: "",
  });
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  console.log(err);
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("500ServerError", {
    pageTitle: "Error!",
    path: "",
  });
});

const connectedUsers = new ConnectedUsers();

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
      socketClient.broadcast.emit("actualUsers", connectedUsers.getAllUsers());
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
    socketClient.to(data.user).to(sessionID).emit("privateMessage", {
      username,
      message: data.message,
    });
  });
});

module.exports = { app, server };
