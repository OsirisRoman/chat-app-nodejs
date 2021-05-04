class ConnectedUsers {
  constructor() {
    this.users = new Map();
  }

  addUser(sessionID, username) {
    const user = { sessionID, username };
    this.users.set(sessionID, user);

    return this.getAllUsers();
  }

  getUser(sessionID) {
    return this.users.get(sessionID);
  }

  getAllUsers() {
    let allUsers = [];
    this.users.forEach(user => allUsers.push(user));
    return allUsers;
  }

  getUsersByChatRoom(roomId) {
    // ...
  }

  removeUser(sessionID) {
    const deletedUser = this.users.get(sessionID);
    this.users.delete(sessionID);
    return deletedUser;
  }
}

module.exports = ConnectedUsers;
