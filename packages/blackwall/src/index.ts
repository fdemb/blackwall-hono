import { Command } from "commander";
import { serve } from "./commands/serve";
import { migrate } from "./commands/migrate";
import { worker } from "./commands/worker";

const program = new Command();

program
  .name("blackwall")
  .description("Blackwall - Project management for software teams")
  .version("0.1.0");

program
  .command("serve", { isDefault: true })
  .description("Start the HTTP server")
  .option("-p, --port <port>", "Port to listen on", "8000")
  .option("--public-dir <path>", "Directory containing static files", "./public")
  .action(serve);

program
  .command("migrate")
  .description("Run database migrations")
  .option("--migrations-dir <path>", "Directory containing migration files", "./migrations")
  .action(migrate);

program
  .command("worker")
  .description("Run the job queue worker")
  .option("--queue <queue>", "Queue name", "default")
  .option("--poll-interval-ms <ms>", "How often to poll for new jobs")
  .option("--stale-check-interval-ms <ms>", "How often to recover stale jobs")
  .option("--cleanup-interval-ms <ms>", "How often to cleanup completed/failed jobs")
  .option("--lock-duration-ms <ms>", "How long to lock a claimed job")
  .action(worker);

program.parse();
