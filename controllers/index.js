const getHome = (req, res, next) => {
  res.render("chat/index", {
    pageTitle: "Express",
    path: "/",
    author: req.session.username,
  });
};

module.exports = {
  getHome,
};
