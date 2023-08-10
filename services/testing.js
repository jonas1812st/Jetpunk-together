const check = require("../services/check");
const crypto = require("crypto");
const rooms = require("../services/rooms");
const users = require("../services/users");

const gamestarted = rooms.gameStarted("1");
console.log(gamestarted);