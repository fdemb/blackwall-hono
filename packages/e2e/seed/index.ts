import path from "node:path";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import * as schema from "@blackwall/database/schema";
import { relations } from "@blackwall/database";
import { DB_PATH } from "../paths.ts";

export { DB_PATH };
const MIGRATIONS_PATH = path.resolve(
  import.meta.dirname,
  "../../database/src/migrations",
);

export function openTestDb() {
  const client = new Database(DB_PATH);
  client.run("PRAGMA journal_mode = WAL;");
  client.run("PRAGMA foreign_keys = ON;");
  const db = drizzle({ client, schema, relations, casing: "snake_case" });
  return { db, client };
}

export async function migrateTestDb() {
  const { db } = openTestDb();
  migrate(db, { migrationsFolder: MIGRATIONS_PATH });
}

export async function resetAllTables() {
  const { client } = openTestDb();
  const tables = [
    "label_on_issue",
    "time_entry",
    "issue_comment",
    "issue_change_event",
    "issue_attachment",
    "issue",
    "issue_sequence",
    "issue_sprint",
    "user_on_team",
    "workspace_invitation",
    "workspace_user",
    "team",
    "label",
    "account",
    "session",
    "verification",
    "workspace",
    "user",
    "job",
  ];
  client.run("PRAGMA foreign_keys = OFF;");
  for (const table of tables) {
    client.run(`DELETE FROM "${table}";`);
  }
  client.run("PRAGMA foreign_keys = ON;");
}
