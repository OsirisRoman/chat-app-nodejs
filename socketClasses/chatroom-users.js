const Chatroom = require("../models/chatroom");

class ChatroomUsers {
  constructor(chatrooms) {
    this.chatrooms = new Map(chatrooms);
  }

  addNewRoom(room) {
    this.chatrooms.set(room.name, { onlineUsers: new Set() });
    Chatroom.findOne({ name: room.name }).then(chatroomDoc => {
      if (!chatroomDoc) {
        const mongodbChatroom = new Chatroom({ ...room, messages: [] });
        mongodbChatroom.save();
      } else {
        chatroomDoc.messages = [];
        chatroomDoc.onlineUsers = [];
        chatroomDoc.save();
      }
    });
  }

  addUserToChatroom(roomName, username) {
    //Map.get(key) returns a reference to the value
    const onlineUsers = this.chatrooms.get(roomName).onlineUsers;
    if (!onlineUsers.has(username)) {
      onlineUsers.add(username);
      //Also update the database
      Chatroom.findOne({ name: roomName }).then(roomDoc => {
        roomDoc.onlineUsers.push(username);
        roomDoc.save();
      });
      return true;
    }
    return false;
  }

  addNewMessage(roomName, privateMessage) {
    //Also update the database
    Chatroom.findOne({ name: roomName }).then(roomDoc => {
      roomDoc.messages.push(privateMessage);
      roomDoc.save();
    });
  }

  removeUserFromChatroom(roomName, username) {
    //Map.get(key) returns a reference to the value
    const onlineUsers = this.chatrooms.get(roomName).onlineUsers;
    onlineUsers.delete(username);
    //Also update the database
    Chatroom.findOne({ name: roomName }).then(roomDoc => {
      roomDoc.onlineUsers = [...onlineUsers];
      roomDoc.save();
    });
  }
}

module.exports = ChatroomUsers;
