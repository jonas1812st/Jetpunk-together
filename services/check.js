const db = require("../services/db");

function sessIdExists(sessId) {
  const exists = db.getOne("SELECT EXISTS(SELECT 1 FROM users WHERE session_id = ?);", sessId);

  return exists["EXISTS(SELECT 1 FROM users WHERE session_id = ?)"];
}

module.exports = Object.assign(
  module.exports, {
    sessIdExists
  });