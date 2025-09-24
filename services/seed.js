const db = require("./db");

function resetRooms() {
  const info = db.runRaw("DELETE FROM rooms;");

  return info;
}

function resetUsers() {
  const info = db.runRaw("DELETE FROM users;");

  return info;
}

function resetSequence() {
  const info = db.runRaw("DELETE FROM sqlite_sequence;");

  return info;
}

function resetDatabase() {
  resetRooms();
  resetUsers();
  resetSequence();

  console.log("\n🌱 Seeding: Sucessfully reset database 🌱 \n\n");
}

// Reset Database with the provided methods
resetDatabase();

module.exports = Object.assign(module.exports, {
  resetRooms,
  resetUsers,
  resetSequence,
  resetDatabase,
});
