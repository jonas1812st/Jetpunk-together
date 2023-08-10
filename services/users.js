const db = require("./db");

function newUser(session_id, name, room, ready) {
  const info = db.run("INSERT INTO users (session_id, username, room, ready) VALUES (?, ?, ?, ?);", [session_id, name, room, ready]);

  return info;
}

function removeUser(session_id) {
  const info = db.run("DELETE FROM users WHERE session_id = ?;", session_id);

  return info;
}

function getUser(session_id) {
  const userInfo = db.getOne("SELECT * FROM users WHERE session_id = ?", session_id);

  return userInfo;
}

function setReadyState(session_id, state) { // state is either 0 (unready) or 1 (ready)
  const info = db.run("UPDATE users SET ready = ? WHERE session_id = ?", [state, session_id]);

  return info;
}

function getUserReady(session_id) {
  const ready = db.getOne("SELECT ready FROM users WHERE session_id = ?;", session_id);

  return ready.ready ? true : false;
}

function removeByRoom(room_id) {
  const info = db.run("DELETE FROM users WHERE room = ?;", room_id);

  return info;
}

function unreadyUsers(room_id, ownerId) {
  const info = db.run("UPDATE users SET ready = 0 WHERE room = ? AND id IS NOT ?;", [room_id, ownerId]);

  return info;
}

function setUserScore(session_id, score, possible) {
  const info = db.run("UPDATE users SET score = ? WHERE session_id = ?;", [score + "/" + possible, session_id]);

  return info;
}

function getScores(room_id) {
  const scores = db.query("SELECT id, username, score FROM users WHERE room = ?", room_id);

  return scores;
}

module.exports = Object.assign(
  module.exports, {
    newUser,
    getUser,
    setReadyState,
    getUserReady,
    removeUser,
    removeByRoom,
    unreadyUsers,
    setUserScore,
    getScores
  });