const check = require("../services/check");
const crypto = require("crypto");
const rooms = require("../services/rooms");
const users = require("../services/users");

const changedState = users.userReadyState("7codtvfv4fnct95gdp3jm7d9mc", 1);
console.log(changedState);