import path from "node:path";

const E2E_ROOT = import.meta.dirname;

export const DB_PATH = path.resolve(
  E2E_ROOT,
  process.env.DATABASE_URL ?? ".e2e/test.db",
);
export const UPLOADS_PATH = path.resolve(
  E2E_ROOT,
  process.env.FILES_DIR ?? ".e2e/uploads",
);
export const AUTH_STATE_PATH = path.resolve(
  E2E_ROOT,
  "fixtures/.auth/user.json",
);
