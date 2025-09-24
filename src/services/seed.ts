import { run, runRaw } from "./db";
import { RunResult } from "better-sqlite3";

export function resetRooms(): RunResult {
  const info = runRaw("DELETE FROM rooms;");
  return info;
}

export function resetUsers(): RunResult {
  const info = runRaw("DELETE FROM users;");
  return info;
}

export function resetSequence(): RunResult {
  const info = runRaw("DELETE FROM sqlite_sequence;");
  return info;
}

export function resetDatabase(): void {
  resetRooms();
  resetUsers();
  resetSequence();

  console.log("\n🌱 Seeding: Sucessfully reset database 🌱 \n\n");
}

// Reset Database with the provided methods
if (require.main === module) {
  resetDatabase();
}