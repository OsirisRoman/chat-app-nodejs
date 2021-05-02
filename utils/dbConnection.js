const mongoose = require("mongoose");
mongoose.Promise = Promise;
const { MONGODB_URI } = require("../constants");

const url = MONGODB_URI;
const connect = mongoose
  .connect(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB Localhost..."))
  .catch(err => console.log(err));

module.exports = connect;
