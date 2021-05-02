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

const indexRouter = require("./routes/index");
const authRoutes = require("./routes/auth");

/**
 * Database connection.
 */

const connect = require("./utils/dbConnection");
const User = require("./models/user");
const { MONGODB_URI } = require("./constants");

const app = express();

/**
 * Create HTTP server.
 */

const server = http.createServer(app);

/**
 * Create Socket IO server on the top of the http server.
 */

const io = socketio(server);

const store = new MongoDBStore({
  uri: MONGODB_URI,
  collection: "sessions",
});

const csfrProtection = csrf();

// view engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store,
  })
);

app.use(csfrProtection);
app.use(flash());

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use((req, res, next) => {
  if (!req.session.user) {
    return next();
  }
  const userID = req.session.user;
  User.findById(userID)
    .then(user => {
      req.user = user;
      next();
    })
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
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
