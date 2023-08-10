const check = require("../services/check");
const crypto = require("crypto");
const rooms = require("../services/rooms");
const fs = require("fs");
const users = require("../services/users");

const finished = check.usersFinished("1");

console.log(finished);