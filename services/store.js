const db = require("../services/db");

function newUser(session_id, name) {
  const info = db.run("INSERT INTO users (session_id, username) VALUES (?, ?);", [session_id, name]);

  return info;
}

function updateUser(session_id, name) {
  const info = db.run("UPDATE users SET username = ? WHERE session_id = ?;", [name, session_id]);

  return info;
}

module.exports = Object.assign(
  module.exports, {
    newUser,
    updateUser
  });