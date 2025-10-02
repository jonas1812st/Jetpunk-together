const db = require("./db");
const fs = require("node:fs");
const path = require("node:path");

function resetFile() {
  const info = fs.writeFileSync(
    path.join(__dirname, "..", "database", "database.db"),
    "",
  );

  return info;
}

function initalizeDB() {
  const sql_statement_rooms = `
			CREATE TABLE rooms (
					id INTEGER PRIMARY KEY,
					owner INTEGER NOT NULL,
			  	room INTEGER NOT NULL,
					quiz TEXT,
					state TEXT
			);
	`;

  const sql_statement_users = `
			CREATE TABLE users (
					id INTEGER PRIMARY KEY,
					session_id TEXT NOT NULL,
					username TEXT NOT NULL,
					room INTEGER,
					ready INTEGER DEFAULT 0,
					score TEXT
			);
		`;

  const info_rooms = db.runWithoutParams(sql_statement_rooms);
  const info_users = db.runWithoutParams(sql_statement_users);

  return {
    info_rooms,
    info_users,
  };
}

function resetRooms() {
  const info = db.runWithoutParams("DELETE FROM rooms;");

  return info;
}

function resetUsers() {
  const info = db.runWithoutParams("DELETE FROM users;");

  return info;
}

function resetSequence() {
  const info = db.runWithoutParams("DELETE FROM sqlite_sequence;");

  db.runWithoutParams("VACUUM;");

  return info;
}

function resetDatabase() {
  // reset file manually
  fs.writeFileSync(path.join(__dirname, "..", "database", "database.db"), "");

  initalizeDB();

  db.closeConnection();

  console.log("\n🌱 Seeding: Sucessfully reset database 🌱 \n\n");
}

// Reset Database with the provided methods
resetDatabase();

module.exports = Object.assign(module.exports, {
  resetRooms,
  resetUsers,
  resetSequence,
  resetDatabase,
  initalizeDB,
  resetFile,
});
