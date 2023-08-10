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

function usersFinished(room_id) {
  const finishedUsers = db.query("SELECT score FROM users WHERE room = ?;", room_id);

  if (!finishedUsers.map(usr => usr.score).includes(null)) {
    return true;
  } else {
    return false;
  };
}

function isQuiz(quiz) {
  var split = quiz.split("/");
  split.splice(0, 1);

  if ((split[0] === "quizzes" || split[0] === "user-quizzes") && split.length > 1) {
    return true;
  } else {
    return false;
  }
}

module.exports = Object.assign(
  module.exports, {
    sessIdExists,
    usersReady,
    usersFinished,
    isQuiz
  });