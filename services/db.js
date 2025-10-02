const Database = require("better-sqlite3");
const path = require("node:path");

const db = new Database(path.join(__dirname, "..", "database", "database.db"));

function query(sql, params = null) {
  return db.prepare(sql).all(params);
}

function getOne(sql, params = null) {
  return db.prepare(sql).get(params);
}

function run(sql, params = null) {
  return db.prepare(sql).run(params);
}

function runWithoutParams(sql) {
  return db.prepare(sql).run();
}

function closeConnection() {
  return db.close();
}

module.exports = Object.assign(module.exports, {
  runWithoutParams,
  query,
  run,
  getOne,
  closeConnection,
});
