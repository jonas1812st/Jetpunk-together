const check = require("../services/check");
const crypto = require("crypto");
const rooms = require("../services/rooms");
const users = require("../services/users");

const usersFinished = check.usersFinished("1");
console.log(usersFinished);