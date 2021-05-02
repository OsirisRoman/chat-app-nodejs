const getHome = (req, res, next) => {
  res.render("chat/index", {
    pageTitle: "Express",
    path: "/",
    author: "Osiris Román",
  });
};

module.exports = {
  getHome,
};
