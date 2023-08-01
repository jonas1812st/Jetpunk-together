const db = require("./db");

function newUser(session_id, name, room) {
  const info = db.run("INSERT INTO users (session_id, username, room) VALUES (?, ?, ?);", [session_id, name, room]);

  return info;
}

function getUser(session_id) {
  const userInfo = db.run("SELECT * FROM users WHERE session_id = ?", session_id);

  return userInfo;
}

module.exports = Object.assign(
  module.exports, {
    newUser,
    getUser
  });