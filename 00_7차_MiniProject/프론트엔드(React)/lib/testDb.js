import Database from "better-sqlite3";

export function openDb() {
  return new Database("../testdb.db", { verbose: console.log });
}
