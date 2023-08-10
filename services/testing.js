const check = require("../services/check");
const crypto = require("crypto");
const rooms = require("../services/rooms");
const fs = require("fs");
const users = require("../services/users");

fs.readFile('../assets/tampermonkey/index.user.js', 'utf8', (err, data) => {
  if (err) {
    console.error(err);
    return;
  }
  console.log(data.replaceAll("http://localhost:3000", "https://google.com"));
});