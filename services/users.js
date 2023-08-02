const db = require("./db");

function newUser(session_id, name, room, ready) {
  const info = db.run("INSERT INTO users (session_id, username, room, ready) VALUES (?, ?, ?, ?);", [session_id, name, room, ready]);

  return info;
}

function getUser(session_id) {
  const userInfo = db.getOne("SELECT * FROM users WHERE session_id = ?", session_id);

  return userInfo;
}

function userReadyState(session_id, state) { // state is either 0 (unready) or 1 (ready)
  const info = db.run("UPDATE users SET ready = ? WHERE session_id = ?", [state, session_id]);

  return info;
}

module.exports = Object.assign(
  module.exports, {
    newUser,
    getUser,
    userReadyState
  });