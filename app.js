const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
const http = require("http");
const serverSocket = require("./serverSocket");

const indexRouter = require("./routes/index");
const authRoutes = require("./routes/auth");
const seedChatrooms = require("./utils/seedChatrooms");

/**
 * Database connection.
 */

const connect = require("./utils/dbConnection");
const User = require("./models/user");

/**
 * Create/Restore Chatrooms with the server .
 */

let chatRooms = [
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

seedChatrooms(chatRooms);

/**
 * Create collection where sessions will stored.
 */

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

serverSocket(server, sessionMiddleware);

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

module.exports = { app, server };
