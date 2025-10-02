import { run, getOne, query } from "./db";
import { RunResult } from "better-sqlite3";

interface Room {
  id: number;
  room: string;
  owner: number;
  quiz: string;
  state: "waiting" | "started" | "ended" | "changing";
}

interface User {
  id: number;
  session_id: string;
  username: string;
  room: number;
  ready: number;
  score?: string;
}

export function updateUserRoom(user_id: number, room: number): RunResult {
  const info = run("UPDATE users SET room = ? WHERE id = ?;", [
    room,
    user_id,
  ]);

  return info;
}

export function newRoom(owner: number, room: string, quiz: string): RunResult {
  const info = run(
    "INSERT INTO rooms (room, owner, quiz, state) VALUES (?, ?, ?, 'waiting');",
    [room, owner, quiz],
  );

  return info;
}

export function removeRoom(roomId: number): RunResult {
  const info = run("DELETE FROM rooms WHERE id = ?", roomId);
  return info;
}

export function getRoom(room: string): Room | undefined {
  const roomInfo = getOne("SELECT * FROM rooms WHERE room = ?", room);
  return roomInfo;
}

export function getRoomById(id: number): Room | undefined {
  const roomInfo = getOne("SELECT * FROM rooms WHERE id = ?", id);
  return roomInfo;
}

export function isOwner(userId: number): Room | undefined {
  const roomInfo = getOne("SELECT * FROM rooms WHERE owner = ?", userId);
  return roomInfo;
}

export function getParticipants(id: number): User[] {
  const participants = query("SELECT * FROM users WHERE room = ?", id);
  return participants;
}

export function setRoomState(room_id: number, state: "waiting" | "started" | "ended" | "changing"): RunResult {
  const info = run("UPDATE rooms SET state = ? WHERE id = ?;", [
    state,
    room_id,
  ]);

  return info;
}

export function setRoomQuiz(room_id: number, quiz: string): RunResult {
  const info = run("UPDATE rooms SET quiz = ? WHERE id = ?;", [
    quiz,
    room_id,
  ]);

  return info;
}

export function resetScores(room_id: number): RunResult {
  const info = run("UPDATE users SET score = NULL WHERE room = ?;", room_id);
  return info;
}

export function gameStarted(room_id: number): boolean {
  const roomInfo = getRoomById(room_id);

  if (roomInfo?.state === "started" || roomInfo?.state === "ended") {
    return true;
  } else {
    return false;
  }
}