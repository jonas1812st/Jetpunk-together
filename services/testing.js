const check = require("../services/check");
const crypto = require("crypto");
const rooms = require("../services/rooms");

const room = rooms.getRoom("E2EBFB");
console.log(room);