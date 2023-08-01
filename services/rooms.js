const db = require("./db");

function updateUserRoom(user_id, room) {
  const info = db.run("UPDATE users SET room = ? WHERE id = ?;", [room, user_id]);

  return info;
}

function newRoom(owner, room, quiz) {
  const info = db.run("INSERT INTO rooms (room, owner, quiz) VALUES (?, ?, ?);", [room, owner, quiz]);

  return info;
};

function getRoom(room) {
  const roomInfo = db.getOne("SELECT * FROM rooms WHERE room = ?", room);

  return roomInfo;
}

module.exports = Object.assign(
  module.exports, {
    newRoom,
    updateUserRoom,
    getRoom
  });