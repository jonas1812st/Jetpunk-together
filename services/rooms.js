const db = require("./db");

function updateUserRoom(user_id, room) {
  const info = db.run("UPDATE users SET room = ? WHERE id = ?;", [room, user_id]);

  return info;
}

function newRoom(owner, room, quiz) {
  const info = db.run("INSERT INTO rooms (room, owner, quiz, state) VALUES (?, ?, ?, 'waiting');", [room, owner, quiz]);

  return info;
};

function removeRoom(roomId) {
  const info = db.run("DELETE FROM rooms WHERE id = ?", roomId);

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

function setRoomState(room_id, state) {
  const info = db.run("UPDATE rooms SET state = ? WHERE id = ?;", [state, room_id]);

  return info;
}

function setRoomQuiz(room_id, quiz) {
  const info = db.run("UPDATE rooms SET quiz = ? WHERE id = ?;", [quiz, room_id]);

  return info;
}

function resetScores(room_id) {
  const info = db.run("UPDATE users SET score = NULL WHERE room = ?;", room_id);

  return info;
}

function gameStarted (room_id) {
  const roomInfo = db.getOne("SELECT state FROM rooms WHERE id = ?", room_id);

  if (roomInfo.state === "started" || roomInfo.state === "ended") {
    return true;
  } else {
    return false;
  }
}

module.exports = Object.assign(
  module.exports, {
    newRoom,
    updateUserRoom,
    getRoom,
    getRoomById,
    isOwner,
    getParticipants,
    setRoomState,
    removeRoom,
    setRoomQuiz,
    resetScores,
    gameStarted
  });