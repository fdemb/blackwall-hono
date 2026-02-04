import { randomUUIDv7 } from "bun";
import { index, primaryKey, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";
import type { JSONParsed } from "hono/utils/types";
import { lifecycleTimestamps } from "../utils";
import { user } from "./auth.schema";
import { issuePlan } from "./issue-plan.schema";
import { workspace } from "./workspace.schema";

// Team table
export const team = sqliteTable(
  "team",
  {
    id: text()
      .primaryKey()
      .$defaultFn(() => randomUUIDv7()),
    name: text().notNull(),
    activePlanId: text().references(() => issuePlan.id), // issue plan that is active right now
    workspaceId: text()
      .notNull()
      .references(() => workspace.id),
    key: text().notNull(),
    avatar: text(),
    ...lifecycleTimestamps,
  },
  (table) => [
    uniqueIndex("team_workspace_id_key_unique").on(table.workspaceId, table.key),
    index("team_active_plan_id_idx").on(table.activePlanId),
  ],
);

// User team junction table
export const userTeam = sqliteTable(
  "user_on_team",
  {
    userId: text()
      .notNull()
      .references(() => user.id),
    teamId: text()
      .notNull()
      .references(() => team.id),
  },
  (table) => [
    primaryKey({
      columns: [table.userId, table.teamId],
    }),
  ],
);

// Types
export type Team = typeof team.$inferSelect;
export type NewTeam = typeof team.$inferInsert;
export type SerializedTeam = JSONParsed<Team>;
