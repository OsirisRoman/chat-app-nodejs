const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const chatroomSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  messages: [
    {
      username: {
        type: String,
        required: true,
      },
      message: {
        type: String,
        required: true,
      },
      messageDate: {
        type: String,
        required: true,
      },
    },
  ],
  onlineUsers: [String],
});

module.exports = mongoose.model("Chatroom", chatroomSchema);
