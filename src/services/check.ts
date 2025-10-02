import { getOne, query } from "./db";

export function sessIdExists(sessId: string): boolean {
  const exists = getOne(
    "SELECT EXISTS(SELECT 1 FROM users WHERE session_id = ?);",
    sessId,
  );

  return exists["EXISTS(SELECT 1 FROM users WHERE session_id = ?)"] === 1;
}

export function usersReady(room_id: number): boolean {
  const users = query("SELECT ready FROM users WHERE room = ?;", room_id);

  if (users.map((el: { ready: number }) => el.ready).includes(0)) {
    return false;
  } else {
    return true;
  }
}

export function usersFinished(room_id: number): boolean {
  const finishedUsers = query(
    "SELECT score FROM users WHERE room = ?;",
    room_id,
  );

  if (!finishedUsers.map((usr: { score: string | null }) => usr.score).includes(null)) {
    return true;
  } else {
    return false;
  }
}

export function isQuiz(quiz: string): boolean {
  const split = quiz.split("/");
  split.splice(0, 1);

  if (
    (split[0] === "quizzes" || split[0] === "user-quizzes") &&
    split.length > 1
  ) {
    return true;
  } else {
    return false;
  }
}