const express = require("express");
const router = express.Router();

const homeController = require("../controllers");
const isAuth = require("../middleware/is-auth");

/* GET home/chat-rooms page. */
router.get("/", isAuth, homeController.getHome);

module.exports = router;
