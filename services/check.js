const db = require("../services/db");

function sessIdExists(sessId) {
  const exists = db.getOne("SELECT EXISTS(SELECT 1 FROM users WHERE session_id = ?);", sessId);

  return exists["EXISTS(SELECT 1 FROM users WHERE session_id = ?)"];
}

function usersReady(room_id) {
  const users = db.query("SELECT ready FROM users WHERE room = ?;", room_id);

  if (users.map(el => el.ready).includes(0)) {
    return false;
  } else {
    return true;
  }
}

module.exports = Object.assign(
  module.exports, {
    sessIdExists,
    usersReady
  });