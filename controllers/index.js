const Chatroom = require("../models/chatroom");

const getHome = (req, res, next) => {
  Chatroom.find().then(rooms => {
    const chatrooms = rooms.map(room => ({
      name: room.name,
      imageUrl: room.imageUrl,
    }));
    res.render("chat/index", {
      pageTitle: "Express",
      path: "/",
      author: req.session.username,
      chatrooms,
    });
  });
};

const getChatroom = (req, res, next) => {
  const roomName = req.params.roomName;
  Chatroom.findOne({ name: roomName })
    .then(room => {
      if (!room) {
        return res.redirect("/");
      }

      res.render("chat/chatroom", {
        room,
        pageTitle: room.name,
        username: req.session.username,
        path: "/chatroom",
      });
    })
    .catch(err => {
      //console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

module.exports = {
  getHome,
  getChatroom,
};
