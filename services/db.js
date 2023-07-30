const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, "..", "database", "database.db"));

function query(sql, params) {
  return db.prepare(sql).all(params);
}

function getOne(sql, params) {
  return db.prepare(sql).get(params);
}

function run(sql, params) {
  return db.prepare(sql).run(params);
}

module.exports = Object.assign(
  module.exports, {
    query,
    run,
    getOne
  });