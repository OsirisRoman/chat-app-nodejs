const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const User = require("../models/user");

const getLogin = (req, res, next) => {
  if (req.session.isLoggedIn) {
    return res.redirect("/");
  }
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login Page",
    errors: req.flash("error"),
    oldValues: undefined,
  });
};

const postLogin = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("auth/login", {
      path: "/login",
      pageTitle: "Login Page",
      errors: errors.errors.map(error => ({
        param: error.param,
        msg: error.msg,
      })),
      oldValues: req.body,
    });
  }
  req.session.isLoggedIn = true;
  req.session.save(err => {
    if (err) {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    }
    res.redirect("/");
  });
};

const postLogout = (req, res, next) => {
  req.session.destroy(err => {
    if (err) {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    }
    res.redirect("/login");
  });
};

const getSignup = (req, res, next) => {
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup Page",
    errors: req.flash("error"),
    oldValues: undefined,
  });
};

const postSignup = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).render("auth/signup", {
      path: "/signup",
      pageTitle: "Signup Page",
      errors: errors.errors.map(error => ({
        param: error.param,
        msg: error.msg,
      })),
      oldValues: req.body,
    });
  }

  bcrypt
    .hash(req.body.password, 12)
    .then(hashedPassword => {
      const user = new User({
        name: req.body.name,
        email: req.body.email,
        password: hashedPassword,
        cart: [],
      });
      return user.save();
    })
    .then(() => res.redirect("/login"))
    .catch(err => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

module.exports = {
  getLogin,
  postLogin,
  postLogout,
  getSignup,
  postSignup,
};
