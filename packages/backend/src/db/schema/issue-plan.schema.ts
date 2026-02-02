import { randomUUIDv7 } from "bun";
import { index, integer, sqliteTable, text, type AnySQLiteColumn } from "drizzle-orm/sqlite-core";
import { lifecycleTimestamps } from "../utils";
import { user } from "./auth.schema";
import { team } from "./team.schema";
import type { JSONParsed } from "hono/utils/types";

export const issuePlan = sqliteTable(
  "issue_plan",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => randomUUIDv7()),
    createdById: text("created_by_id")
      .notNull()
      .references((): AnySQLiteColumn => user.id),
    name: text().notNull(),
    goal: text(),
    teamId: text("team_id") // we can resolve the workspace through this relationship
      .notNull()
      .references((): AnySQLiteColumn => team.id),
    startDate: integer({
      mode: "timestamp_ms",
    }).notNull(),
    endDate: integer({
      mode: "timestamp_ms",
    }).notNull(),

    // when the plan was finished - not necessarily the same as endDate
    finishedAt: integer({
      mode: "timestamp_ms",
    }),
    ...lifecycleTimestamps,
  },
  (table) => [
    index("issue_plan_created_by_id_idx").on(table.createdById),
    index("issue_plan_team_id_idx").on(table.teamId),
  ],
);

export type IssuePlan = typeof issuePlan.$inferSelect;
export type NewIssuePlan = typeof issuePlan.$inferInsert;
export type SerializedIssuePlan = JSONParsed<IssuePlan>
