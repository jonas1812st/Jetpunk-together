const db = require("../services/db");

function newUser(session_id, name, room) {
  const info = db.run("INSERT INTO users (session_id, username, room) VALUES (?, ?, ?);", [session_id, name, room]);

  return info;
}

function upadateUserRoom(user_id, room) {
  const info = db.run("UPDATE users SET room = ? WHERE id = ?;", [room, user_id]);

  return info;
}

function newRoom(owner, room) {
  const info = db.run("INSERT INTO rooms (room, owner) VALUES (?, ?);", [room, owner]);
};

module.exports = Object.assign(
  module.exports, {
    newUser,
    newRoom,
    upadateUserRoom
  });