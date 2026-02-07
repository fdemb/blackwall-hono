import { faker } from "@faker-js/faker";
import { and, eq } from "drizzle-orm";
import { possibleColors } from "@blackwall/shared";
import { client, db, dbSchema } from "./index";

const DEFAULT_SEED = 20260207;
const DEFAULT_PASSWORD = "Passw0rd!";
const DAY_MS = 24 * 60 * 60 * 1000;

const TEAM_BLUEPRINTS = [
  { key: "ENG", name: "Engineering", issueCount: 24 },
  { key: "MOB", name: "Mobile", issueCount: 18 },
  { key: "DES", name: "Design", issueCount: 14 },
] as const;

const ISSUE_STATUS_WEIGHTS = [
  { value: "to_do" as const, weight: 34 },
  { value: "in_progress" as const, weight: 36 },
  { value: "done" as const, weight: 30 },
] as const;

const ISSUE_PRIORITY_WEIGHTS = [
  { value: "low" as const, weight: 14 },
  { value: "medium" as const, weight: 42 },
  { value: "high" as const, weight: 30 },
  { value: "urgent" as const, weight: 14 },
] as const;

const ESTIMATION_POINTS = [1, 2, 3, 5, 8, 13];

const ISSUE_SUMMARY_BANK: Record<(typeof TEAM_BLUEPRINTS)[number]["key"], string[]> = {
  ENG: [
    "Improve CI pipeline reliability",
    "Optimize API response caching",
    "Migrate audit logging to event stream",
    "Roll out feature flags for billing",
    "Refactor webhook retry strategy",
    "Add guardrails for schema migrations",
    "Harden OAuth callback handling",
    "Add rate limiting for public endpoints",
  ],
  MOB: [
    "Implement offline issue drafts",
    "Reduce app cold start time",
    "Fix Android push notification deep-linking",
    "Add crash-free session dashboard",
    "Improve sync conflict resolution UX",
    "Ship native image upload flow",
    "Add biometric lock option",
    "Improve timeline scrolling performance",
  ],
  DES: [
    "Redesign issue detail header states",
    "Standardize iconography for navigation",
    "Audit contrast in dark and light themes",
    "Define empty states for board views",
    "Refresh workspace onboarding flow",
    "Create interaction specs for keyboard shortcuts",
    "Tighten spacing scale across settings pages",
    "Prototype team analytics dashboard",
  ],
};

type SeedOptions = {
  seed: number;
  reset: boolean;
};

type SeededIssue = typeof dbSchema.issue.$inferSelect;
type SeededTeam = typeof dbSchema.team.$inferSelect;
type SeededUser = typeof dbSchema.user.$inferSelect;

function parseOptions(argv: string[]): SeedOptions {
  let seed = DEFAULT_SEED;
  let reset = true;

  for (let i = 0; i < argv.length; i++) {
    const current = argv[i];
    if (!current) {
      continue;
    }

    if (current === "--no-reset") {
      reset = false;
      continue;
    }

    if (current === "--reset") {
      reset = true;
      continue;
    }

    if (current === "--seed") {
      const next = argv[i + 1];
      if (!next) {
        throw new Error("Missing value for --seed");
      }

      const parsed = Number.parseInt(next, 10);
      if (!Number.isFinite(parsed)) {
        throw new Error(`Invalid --seed value: ${next}`);
      }

      seed = parsed;
      i += 1;
      continue;
    }

    if (current.startsWith("--seed=")) {
      const value = current.slice("--seed=".length);
      const parsed = Number.parseInt(value, 10);
      if (!Number.isFinite(parsed)) {
        throw new Error(`Invalid --seed value: ${value}`);
      }
      seed = parsed;
    }
  }

  return { seed, reset };
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function pickWeighted<T>(items: ReadonlyArray<{ value: T; weight: number }>): T {
  const totalWeight = items.reduce((acc, item) => acc + item.weight, 0);
  const needle = faker.number.int({ min: 1, max: totalWeight });
  let current = 0;

  for (const item of items) {
    current += item.weight;
    if (needle <= current) {
      return item.value;
    }
  }

  return items[items.length - 1]!.value;
}

function richText(text: string) {
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: [{ type: "text", text }],
      },
    ],
  };
}

function buildUserNames(count: number): string[] {
  const primary = ["Ava Patel", "Noah Kim", "Maya Johnson", "Lucas Rivera"];
  const names = [...primary];

  while (names.length < count) {
    names.push(faker.person.fullName());
  }

  return names.slice(0, count);
}

function sampleTeamAssignments(users: SeededUser[], teams: SeededTeam[]) {
  const teamByKey = new Map(teams.map((team) => [team.key, team]));
  const eng = teamByKey.get("ENG");
  const mob = teamByKey.get("MOB");
  const des = teamByKey.get("DES");

  if (!eng || !mob || !des) {
    throw new Error("Expected ENG, MOB and DES teams to exist.");
  }

  const base: Array<{ userId: string; teamId: string }> = [];

  for (const [index, user] of users.entries()) {
    if (index <= 6) {
      base.push({ userId: user.id, teamId: eng.id });
    }

    if (index === 0 || index >= 6) {
      base.push({ userId: user.id, teamId: mob.id });
    }

    if (index === 0 || index >= 8) {
      base.push({ userId: user.id, teamId: des.id });
    }
  }

  return base;
}

function issueSummaryForTeam(teamKey: (typeof TEAM_BLUEPRINTS)[number]["key"]): string {
  const base = faker.helpers.arrayElement(ISSUE_SUMMARY_BANK[teamKey]);
  const suffixes = [
    "for Q2 launch",
    "before customer rollout",
    "with analytics tracking",
    "for enterprise beta",
    "based on support feedback",
  ];

  return `${base} ${faker.helpers.arrayElement(suffixes)}`;
}

function issueStatus(): (typeof dbSchema.issue.$inferInsert)["status"] {
  return pickWeighted(ISSUE_STATUS_WEIGHTS);
}

function issuePriority(): (typeof dbSchema.issue.$inferInsert)["priority"] {
  return pickWeighted(ISSUE_PRIORITY_WEIGHTS);
}

async function resetAllTables() {
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

async function main() {
  const options = parseOptions(Bun.argv.slice(2));
  faker.seed(options.seed);

  if (options.reset) {
    await resetAllTables();
  }

  const now = new Date();
  const runTag = Date.now().toString(36).slice(-6);
  const companyName = faker.company.name();
  const workspaceSlug = `${slugify(companyName)}-${runTag}`;
  const workspaceDisplayName = `${companyName} Product`;

  const [workspace] = await db
    .insert(dbSchema.workspace)
    .values({
      slug: workspaceSlug,
      displayName: workspaceDisplayName,
      logoUrl: null,
    })
    .returning();

  if (!workspace) {
    throw new Error("Failed to create workspace");
  }

  const names = buildUserNames(12);
  const usersToInsert = names.map((name, index) => {
    const emailLocal = slugify(name).replace(/-/g, ".");
    return {
      name,
      email: `${emailLocal}.${options.seed}.${runTag}.${index + 1}@example.blackwall.dev`,
      emailVerified: true,
      image: null,
      createdAt: faker.date.past({ years: 1 }),
      updatedAt: now,
    };
  });

  const users = await db.insert(dbSchema.user).values(usersToInsert).returning();

  if (users.length === 0) {
    throw new Error("Failed to create users");
  }

  await db.insert(dbSchema.workspaceUser).values(
    users.map((seedUser) => ({
      workspaceId: workspace.id,
      userId: seedUser.id,
      joinedAt: faker.date.between({
        from: new Date(now.getTime() - 90 * DAY_MS),
        to: now,
      }),
    })),
  );

  const passwordHash = await Bun.password.hash(DEFAULT_PASSWORD);
  await db.insert(dbSchema.account).values(
    users.map((seedUser) => ({
      userId: seedUser.id,
      accountId: seedUser.id,
      providerId: "credential",
      password: passwordHash,
      createdAt: new Date(now.getTime() - faker.number.int({ min: 10, max: 50 }) * DAY_MS),
      updatedAt: now,
    })),
  );

  await db.insert(dbSchema.workspaceInvitation).values(
    Array.from({ length: 3 }).map(() => ({
      workspaceId: workspace.id,
      createdById: users[0]!.id,
      email: faker.internet.email().toLowerCase(),
      token: crypto.randomUUID(),
      expiresAt: new Date(now.getTime() + 5 * DAY_MS),
    })),
  );

  const teams = await db
    .insert(dbSchema.team)
    .values(
      TEAM_BLUEPRINTS.map((team) => ({
        name: team.name,
        key: team.key,
        avatar: null,
        workspaceId: workspace.id,
      })),
    )
    .returning();

  if (teams.length !== TEAM_BLUEPRINTS.length) {
    throw new Error("Failed to create all teams");
  }

  const userTeamRows = sampleTeamAssignments(users, teams);
  await db.insert(dbSchema.userTeam).values(userTeamRows);

  await db.insert(dbSchema.issueSequence).values(
    teams.map((team) => ({
      workspaceId: workspace.id,
      teamId: team.id,
      currentSequence: 0,
    })),
  );

  const sprintRows: Array<typeof dbSchema.issueSprint.$inferInsert> = [];
  for (const team of teams) {
    sprintRows.push(
      {
        name: `${team.key} Sprint 24`,
        goal: faker.company.catchPhrase(),
        teamId: team.id,
        createdById: users[0]!.id,
        startDate: new Date(now.getTime() - 28 * DAY_MS),
        endDate: new Date(now.getTime() - 14 * DAY_MS),
        finishedAt: new Date(now.getTime() - 13 * DAY_MS),
      },
      {
        name: `${team.key} Sprint 25`,
        goal: faker.company.catchPhrase(),
        teamId: team.id,
        createdById: users[0]!.id,
        startDate: new Date(now.getTime() - 7 * DAY_MS),
        endDate: new Date(now.getTime() + 7 * DAY_MS),
      },
      {
        name: `${team.key} Sprint 26`,
        goal: faker.company.catchPhrase(),
        teamId: team.id,
        createdById: users[0]!.id,
        startDate: new Date(now.getTime() + 14 * DAY_MS),
        endDate: new Date(now.getTime() + 28 * DAY_MS),
      },
    );
  }

  const sprints = await db.insert(dbSchema.issueSprint).values(sprintRows).returning();

  const sprintByTeamAndName = new Map(sprints.map((sprint) => [`${sprint.teamId}:${sprint.name}`, sprint]));
  for (const team of teams) {
    const active = sprintByTeamAndName.get(`${team.id}:${team.key} Sprint 25`);
    if (!active) {
      throw new Error(`Missing active sprint for ${team.key}`);
    }

    await db.update(dbSchema.team).set({ activeSprintId: active.id }).where(eq(dbSchema.team.id, team.id));
  }

  const primaryTeamByUserId = new Map<string, string>();
  for (const row of userTeamRows) {
    if (!primaryTeamByUserId.has(row.userId)) {
      primaryTeamByUserId.set(row.userId, row.teamId);
    }
  }

  for (const seedUser of users) {
    await db
      .update(dbSchema.user)
      .set({
        lastWorkspaceId: workspace.id,
        lastTeamId: primaryTeamByUserId.get(seedUser.id) ?? teams[0]!.id,
      })
      .where(eq(dbSchema.user.id, seedUser.id));
  }

  const labels = await db
    .insert(dbSchema.label)
    .values([
      "bug",
      "feature",
      "tech debt",
      "infra",
      "customer",
      "security",
      "performance",
      "design",
    ].map((name, index) => ({
      name,
      colorKey: possibleColors[index % possibleColors.length]!,
      workspaceId: workspace.id,
      createdAt: new Date(now.getTime() - (index + 3) * DAY_MS),
      updatedAt: now,
    })))
    .returning();

  const membersByTeamId = new Map<string, SeededUser[]>();
  for (const team of teams) {
    const memberIds = userTeamRows.filter((row) => row.teamId === team.id).map((row) => row.userId);
    membersByTeamId.set(
      team.id,
      users.filter((seedUser) => memberIds.includes(seedUser.id)),
    );
  }

  const issuesToInsert: Array<typeof dbSchema.issue.$inferInsert> = [];
  const sequenceByTeamId = new Map(teams.map((team) => [team.id, 0]));

  for (const blueprint of TEAM_BLUEPRINTS) {
    const team = teams.find((t) => t.key === blueprint.key);
    if (!team) {
      throw new Error(`Missing team for blueprint ${blueprint.key}`);
    }

    const teamMembers = membersByTeamId.get(team.id);
    if (!teamMembers || teamMembers.length === 0) {
      throw new Error(`Team ${team.key} has no members`);
    }

    const pastSprint = sprintByTeamAndName.get(`${team.id}:${team.key} Sprint 24`);
    const activeSprint = sprintByTeamAndName.get(`${team.id}:${team.key} Sprint 25`);
    const nextSprint = sprintByTeamAndName.get(`${team.id}:${team.key} Sprint 26`);

    if (!pastSprint || !activeSprint || !nextSprint) {
      throw new Error(`Missing one or more sprints for ${team.key}`);
    }

    for (let i = 0; i < blueprint.issueCount; i++) {
      const nextSequence = (sequenceByTeamId.get(team.id) ?? 0) + 1;
      sequenceByTeamId.set(team.id, nextSequence);

      const status = issueStatus();
      const priority = issuePriority();
      const createdBy = faker.helpers.arrayElement(teamMembers);

      let sprintId: string | null = null;
      if (status === "done") {
        sprintId = faker.number.float({ min: 0, max: 1 }) > 0.6 ? activeSprint.id : pastSprint.id;
      } else if (status === "in_progress") {
        sprintId = activeSprint.id;
      } else if (status === "to_do") {
        const sprintRoll = faker.number.float({ min: 0, max: 1 });
        if (sprintRoll > 0.85) {
          sprintId = nextSprint.id;
        } else if (sprintRoll > 0.4) {
          sprintId = activeSprint.id;
        }
      }

      const shouldAssign = sprintId !== null || faker.number.float({ min: 0, max: 1 }) > 0.65;
      const assignedTo = shouldAssign ? faker.helpers.arrayElement(teamMembers) : null;

      const createdAt = faker.date.between({
        from: new Date(now.getTime() - 45 * DAY_MS),
        to: new Date(now.getTime() - DAY_MS),
      });
      const updatedAt = faker.date.between({ from: createdAt, to: now });
      const summary = issueSummaryForTeam(blueprint.key);
      const contextLine = faker.lorem.sentence({ min: 8, max: 14 });

      issuesToInsert.push({
        key: `${team.key}-${nextSequence}`,
        keyNumber: nextSequence,
        summary,
        description: richText(`${summary}. ${contextLine}`) as never,
        status,
        priority,
        order: i + 1,
        estimationPoints:
          status === "done" || status === "in_progress" || faker.number.float({ min: 0, max: 1 }) > 0.5
            ? faker.helpers.arrayElement(ESTIMATION_POINTS)
            : null,
        workspaceId: workspace.id,
        teamId: team.id,
        createdById: createdBy.id,
        assignedToId: assignedTo?.id ?? null,
        sprintId,
        createdAt,
        updatedAt,
      });
    }
  }

  const issues = await db.insert(dbSchema.issue).values(issuesToInsert).returning();

  for (const team of teams) {
    const sequence = sequenceByTeamId.get(team.id) ?? 0;
    await db
      .update(dbSchema.issueSequence)
      .set({ currentSequence: sequence })
      .where(
        and(
          eq(dbSchema.issueSequence.workspaceId, workspace.id),
          eq(dbSchema.issueSequence.teamId, team.id),
        ),
      );
  }

  const labelsOnIssues: Array<typeof dbSchema.labelOnIssue.$inferInsert> = [];
  for (const seedIssue of issues) {
    const labelCount = seedIssue.priority === "urgent" ? 3 : faker.number.int({ min: 1, max: 2 });
    const picked = faker.helpers.arrayElements(labels, labelCount);
    for (const issueLabel of picked) {
      labelsOnIssues.push({
        issueId: seedIssue.id,
        labelId: issueLabel.id,
      });
    }
  }

  if (labelsOnIssues.length > 0) {
    await db.insert(dbSchema.labelOnIssue).values(labelsOnIssues);
  }

  const comments: Array<typeof dbSchema.issueComment.$inferInsert> = [];
  const timeEntries: Array<typeof dbSchema.timeEntry.$inferInsert> = [];
  const events: Array<typeof dbSchema.issueChangeEvent.$inferInsert> = [];

  for (const issue of issues) {
    const teamMembers = membersByTeamId.get(issue.teamId) ?? users;
    events.push({
      issueId: issue.id,
      workspaceId: workspace.id,
      actorId: issue.createdById,
      eventType: "issue_created",
      createdAt: issue.createdAt,
    });

    if (issue.status !== "to_do") {
      events.push({
        issueId: issue.id,
        workspaceId: workspace.id,
        actorId: issue.assignedToId ?? issue.createdById,
        eventType: "status_changed",
        changes: {
          status: {
            from: "to_do",
            to: issue.status,
          },
        } as never,
        createdAt: faker.date.between({ from: issue.createdAt, to: issue.updatedAt }),
      });
    }

    const commentCount =
      issue.status === "done"
        ? faker.number.int({ min: 1, max: 4 })
        : faker.number.int({ min: 0, max: 2 });

    for (let i = 0; i < commentCount; i++) {
      const author = faker.helpers.arrayElement(teamMembers);
      const commentId = crypto.randomUUID();
      const createdAt = faker.date.between({
        from: issue.createdAt,
        to: now,
      });

      comments.push({
        id: commentId,
        issueId: issue.id,
        authorId: author.id,
        content: richText(faker.lorem.sentences({ min: 1, max: 3 })) as never,
        createdAt,
        updatedAt: createdAt,
      });

      events.push({
        issueId: issue.id,
        workspaceId: workspace.id,
        actorId: author.id,
        eventType: "comment_added",
        relatedEntityId: commentId,
        createdAt,
      });
    }

    if (issue.status === "in_progress" || issue.status === "done") {
      const entryCount =
        issue.status === "done"
          ? faker.number.int({ min: 1, max: 4 })
          : faker.number.int({ min: 1, max: 2 });

      for (let i = 0; i < entryCount; i++) {
        const user = issue.assignedToId
          ? teamMembers.find((member) => member.id === issue.assignedToId) ??
            faker.helpers.arrayElement(teamMembers)
          : faker.helpers.arrayElement(teamMembers);
        const entryId = crypto.randomUUID();
        const createdAt = faker.date.between({
          from: issue.createdAt,
          to: now,
        });

        timeEntries.push({
          id: entryId,
          issueId: issue.id,
          userId: user.id,
          duration: faker.helpers.arrayElement([30, 45, 60, 90, 120, 180, 240]),
          description: faker.hacker.phrase(),
          createdAt,
          updatedAt: createdAt,
        });

        events.push({
          issueId: issue.id,
          workspaceId: workspace.id,
          actorId: user.id,
          eventType: "time_logged",
          relatedEntityId: entryId,
          createdAt,
        });
      }
    }
  }

  if (comments.length > 0) {
    await db.insert(dbSchema.issueComment).values(comments);
  }

  if (timeEntries.length > 0) {
    await db.insert(dbSchema.timeEntry).values(timeEntries);
  }

  if (events.length > 0) {
    await db.insert(dbSchema.issueChangeEvent).values(events);
  }

  console.log("Seed complete.");
  console.log(`Workspace: ${workspace.displayName} (${workspace.slug})`);
  console.log(`Users: ${users.length} (password for all users: ${DEFAULT_PASSWORD})`);
  console.log(`Teams: ${teams.length}`);
  console.log(`Sprints: ${sprints.length}`);
  console.log(`Issues: ${issues.length}`);
  console.log(`Labels: ${labels.length}`);
  console.log(`Comments: ${comments.length}`);
  console.log(`Time entries: ${timeEntries.length}`);
  console.log(`Issue change events: ${events.length}`);
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
