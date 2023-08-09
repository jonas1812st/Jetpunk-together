const check = require("../services/check");
const crypto = require("crypto");
const rooms = require("../services/rooms");
const users = require("../services/users");

const changedState = users.getUserReady("m4rb0qdher7mvdg5v97do9mtmo");
console.log(changedState);