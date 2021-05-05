const Chatroom = require("../models/chatroom");

const seedChatrooms = chatRooms => {
  chatRooms.forEach(room => {
    Chatroom.findOne({ name: room.name }).then(chatroomDoc => {
      if (!chatroomDoc) {
        const mongodbChatroom = new Chatroom({ ...room, messages: [] });
        mongodbChatroom.save();
      } else {
        chatroomDoc.messages = [];
        chatroomDoc.save();
      }
    });
  });
};

module.exports = seedChatrooms;
