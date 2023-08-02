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

function getRoomById(id) {
  const roomInfo = db.getOne("SELECT * FROM rooms WHERE id = ?", id);

  return roomInfo;
}

function isOwner(userId) {
  const roomInfo = db.getOne("SELECT * FROM rooms WHERE owner = ?", userId);

  return roomInfo;
}

function getParticipants(id) {
  const participants = db.query("SELECT * FROM users WHERE room = ?", id);

  return participants;
}

module.exports = Object.assign(
  module.exports, {
    newRoom,
    updateUserRoom,
    getRoom,
    getRoomById,
    isOwner,
    getParticipants
  });