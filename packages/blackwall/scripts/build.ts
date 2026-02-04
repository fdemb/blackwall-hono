import { $ } from "bun";
import { cpSync, rmSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT_DIR = join(import.meta.dirname, "..");
const DIST_DIR = join(ROOT_DIR, "dist");
const PACKAGES_DIR = join(ROOT_DIR, "..");

async function build() {
  console.log("Building Blackwall...\n");

  // Clean dist directory
  rmSync(DIST_DIR, { recursive: true, force: true });
  mkdirSync(DIST_DIR, { recursive: true });

  // Build the frontend
  console.log("Building frontend...");
  await $`bun run build`.cwd(join(PACKAGES_DIR, "frontend"));

  // Compile the CLI binary
  console.log("\nCompiling CLI binary...");
  await $`bun build --compile --minify --outfile ${join(DIST_DIR, "blackwall")} ${join(ROOT_DIR, "src/index.ts")}`;

  // Copy frontend dist to public/
  console.log("\nCopying frontend assets...");
  cpSync(join(PACKAGES_DIR, "frontend/dist"), join(DIST_DIR, "public"), { recursive: true });

  // Copy migrations
  console.log("Copying migrations...");
  cpSync(join(PACKAGES_DIR, "database/src/migrations"), join(DIST_DIR, "migrations"), {
    recursive: true,
  });

  console.log("\nBuild complete!");
  console.log(`Output: ${DIST_DIR}/`);
  console.log("  - blackwall (CLI binary)");
  console.log("  - public/ (frontend assets)");
  console.log("  - migrations/ (database migrations)");
}

build().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
