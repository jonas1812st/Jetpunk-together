const db = require("../services/db");

function newUser(session_id, name, room) {
  const info = db.run("INSERT INTO users (session_id, username, room) VALUES (?, ?, ?);", [session_id, name, room]);

  return info;
}

module.exports = Object.assign(
  module.exports, {
    newUser
  });