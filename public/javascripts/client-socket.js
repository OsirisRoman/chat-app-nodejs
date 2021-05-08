const socket = io();

//Get the textarea element where the user write its message
const textarea = document.getElementsByTagName("textarea")[0];

//This listener allow the user to sent its message by
//pressing "Enter". The combination shift+Enter allow
//the user to write multiline messages.
textarea.addEventListener("keydown", e => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

//This function moves the messages scroll object to the position where
//the last message is visible.
const scrollToEnd = () => {
  //Get the position of the last added element
  const topPos = document.getElementsByClassName("chat-list")[0]
    .lastElementChild.offsetTop;
  //Scroll the messages at the last added element position
  document.getElementsByClassName("chat-list")[0].scrollTop = topPos;
};

//Adding the sent/received message to the DOM
const renderMessageAtDOM = (username, message, messageDate) => {
  const chatLength = document.querySelectorAll(".chat-list li").length;

  //Render the last 50 messages
  if (chatLength >= 50) {
    document.querySelector(".chat-list li").remove();
  }
  /*
   * Adding the message Html element to the actual view
   */
  let htmlText = `<div class="chat-content"><h5>${username} <p class="chat-time mb-0">${messageDate}</p></h5><div class="box bg-light-info">${message}</div>
  </div>`;
  let li = document.createElement("li");
  //In case the message is rendered in the chatroom of the same user
  if (username.length === 0) {
    htmlText = `<div class="chat-content"><h5><p class="chat-time mb-0">${messageDate}</p></h5><div class="box bg-light-inverse">${message}</div>
    </div>`;
    li.classList.add("reverse");
  }
  li.innerHTML = htmlText.trim();
  let ul = document.getElementsByClassName("chat-list")[0];
  ul.insertAdjacentElement("beforeEnd", li);
};

//This fuction send the user message when executed.
const sendMessage = () => {
  //Get the actual usermessage from the textarea html tag.
  let message = document.getElementsByTagName("textarea")[0].value;
  //Send the message just when there is a message to send
  if (message.length > 0) {
    /*
     * < > & " ' these five must be encoded to avoid
     * HTML rendering problems
     * & must be the firt character replaced.
     */
    message = message.replaceAll("&", "&amp;");
    message = message.replaceAll("<", "&lt;");
    message = message.replaceAll(">", "&gt;");
    message = message.replaceAll('"', "&quot;");
    message = message.replaceAll("'", "&apos");
    //In case the user sent a multiline message <br>
    //will be necessary to render appropriately the
    //html for this kind of messages
    message = message.replaceAll("\n", "<br>");
    //remove the text from the textarea
    document.getElementsByTagName("textarea")[0].value = "";
    //Maintain the textarea always focused waiting for user input
    textarea.focus();
    //Date string with format "d/m/yy hh:mm"(6/5/21 15:13)
    let messageDate = new Date().toLocaleString("default", {
      dateStyle: "short",
      timeStyle: "short",
    });
    /*
     * Adding the message to the DOM
     */
    renderMessageAtDOM("", message, messageDate);
    /*
     * Send the message to the room chanel
     */
    socket.emit("privateMessage", message);
    //Always scroll the messages view to the end after sent a message
    scrollToEnd();
  }
};

//This fuction add the received message in Html format to the actual view
const receiveMessage = ({ username, message, messageDate }) => {
  //Get logged username
  let actualUsername = document.querySelectorAll(".chatonline a span")[0]
    .textContent;

  if (actualUsername.includes(username)) {
    username = "";
  }

  renderMessageAtDOM(username, message, messageDate);
  //Always scroll the messages view to the end after receive a message
  scrollToEnd();
};

const addOnlineUser = ({ username, messageDate }) => {
  let message = `${username} has joined`;
  /*
   * Adding the server message to the DOM
   */
  renderMessageAtDOM("Server", message, messageDate);
  /*
   * Adding the username to the onlineUsers list
   */
  let htmlText = `<a><span>${username} <small class="text-success">online</small></span></a>`;
  let li = document.createElement("li");
  li.id = username;
  li.innerHTML = htmlText.trim();
  let ul = document.getElementsByClassName("chatonline")[0];
  ul.insertAdjacentElement("beforeEnd", li);
  //Always scroll the messages view to the end after a user join the chat
  scrollToEnd();
};

const removeOnlineUser = ({ username, messageDate }) => {
  let message = `${username} left the room`;
  /*
   * Adding the server message to the DOM
   */
  renderMessageAtDOM("Server", message, messageDate);
  /*
   * removing the username from the onlineUsers list
   */
  document.getElementById(username).remove();
  //Always scroll the messages view to the end after a user left the chat
  scrollToEnd();
};

// Listening in case the user logout
// from another session tab
socket.on("connect", () => {
  const liArray = document.querySelectorAll(".chat-list li");
  if (liArray.length !== 0) {
    scrollToEnd();
  }
});

// Listening in case the user logout
// from another session tab
socket.on("logout", () => {
  document.location.replace("/");
});

// If the user logout, the socket
// emit a loggout event
const emitLogout = () => {
  socket.emit("logout");
};

// Listening for incomming messages
socket.on("privateMessage", function (roomMessage) {
  receiveMessage(roomMessage);
});

// Listening for different session user connection
socket.on("addOnlineUser", function (username) {
  addOnlineUser(username);
});

// Listening for different session user connection
socket.on("removeOnlineUser", function (username) {
  removeOnlineUser(username);
});
