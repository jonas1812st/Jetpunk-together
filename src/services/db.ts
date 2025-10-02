import Database from "better-sqlite3";
import { join } from "node:path";
import { RunResult, Database as DatabaseType } from "better-sqlite3";

const db: DatabaseType = new Database(join(__dirname, "..", "..", "database", "database.db"));

export function query(sql: string, params?: any): any[] {
  return db.prepare(sql).all(params);
}

export function getOne(sql: string, params?: any): any {
  return db.prepare(sql).get(params);
}

export function run(sql: string, params?: any): RunResult {
  return db.prepare(sql).run(params);
}

export function runRaw(sql: string): RunResult {
  return db.prepare(sql).run();
}