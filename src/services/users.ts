import { run, getOne, query } from "./db";
import { RunResult } from "better-sqlite3";

interface User {
  id: number;
  session_id: string;
  username: string;
  room: number;
  ready: number;
  score?: string;
}

export function newUser(session_id: string, name: string, room: string, ready: number): RunResult {
  const info = run(
    "INSERT INTO users (session_id, username, room, ready) VALUES (?, ?, ?, ?);",
    [session_id, name, room, ready],
  );

  return info;
}

export function removeUser(session_id: string): RunResult {
  const info = run("DELETE FROM users WHERE session_id = ?;", session_id);
  return info;
}

export function getUser(session_id: string): User | undefined {
  const userInfo = getOne(
    "SELECT * FROM users WHERE session_id = ?",
    session_id,
  );

  return userInfo;
}

export function setReadyState(session_id: string, state: number): RunResult {
  // state is either 0 (unready) or 1 (ready)
  const info = run("UPDATE users SET ready = ? WHERE session_id = ?", [
    state,
    session_id,
  ]);

  return info;
}

export function getUserReady(session_id: string): boolean {
  const ready = getOne(
    "SELECT ready FROM users WHERE session_id = ?;",
    session_id,
  );

  return ready?.ready ? true : false;
}

export function removeByRoom(room_id: number): RunResult {
  const info = run("DELETE FROM users WHERE room = ?;", room_id);
  return info;
}

export function unreadyUsers(room_id: number, ownerId: number): RunResult {
  const info = run(
    "UPDATE users SET ready = 0 WHERE room = ? AND id IS NOT ?;",
    [room_id, ownerId],
  );

  return info;
}

export function setUserScore(session_id: string, score: number, possible: number): RunResult {
  const info = run("UPDATE users SET score = ? WHERE session_id = ?;", [
    score + "/" + possible,
    session_id,
  ]);

  return info;
}

export function getScores(room_id: number): Array<{ id: number; username: string; score: string }> {
  const scores = query(
    "SELECT id, username, score FROM users WHERE room = ?",
    room_id,
  );

  return scores;
}