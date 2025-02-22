import Database from "better-sqlite3";

export function openDb() {
  return new Database("./em.db", { verbose: console.log });
}
