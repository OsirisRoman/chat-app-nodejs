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
      /*
       * Here room.messages must be modified to transform date into a string with hh:mm am/pm format
       */
      res.render("chat/chatroom", {
        room: {
          name: room.name,
          imageUrl: "",
          messages: [
            {
              username: "Username-1",
              message:
                "Lorem Ipsum is simply dummy text of the printing & type setting industry.",
              date: "10:57 am",
            },
            {
              username: "Username-2",
              message:
                "Lorem Ipsum is simply dummy text of the printing & type setting industry.",
              date: "10:57 am",
            },
            {
              username: "Username-3",
              message:
                "Lorem Ipsum is simply dummy text of the printing & type setting industry.",
              date: "10:57 am",
            },
            {
              username: req.session.username,
              message:
                "Lorem Ipsum is simply dummy text of the printing & type setting industry.",
              date: "10:57 am",
            },
            {
              username: "Username-2",
              message:
                "Lorem Ipsum is simply dummy text of the printing & type setting industry.",
              date: "10:57 am",
            },
            {
              username: req.session.username,
              message:
                "Lorem Ipsum is simply dummy text of the printing & type setting industry.",
              date: "10:57 am",
            },
            {
              username: "Username-2",
              message:
                "Lorem Ipsum is simply dummy text of the printing & type setting industry.",
              date: "10:57 am",
            },
            {
              username: "Username-3",
              message:
                "Lorem Ipsum is simply dummy text of the printing & type setting industry.",
              date: "10:57 am",
            },
            {
              username: req.session.username,
              message:
                "Lorem Ipsum is simply dummy text of the printing & type setting industry.",
              date: "10:57 am",
            },
          ],
          onlineUsers: [
            "Username-1",
            "Username-2",
            "Username-3",
            "Username-4",
            "Username-5",
          ], //["username-1", "username-2", ...]
        },
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
