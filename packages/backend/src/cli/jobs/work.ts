import { Command } from "commander";
import { jobService } from "../../features/jobs/job.service";
import "../../jobs/register";

const program = new Command();

const parseNumber = (value: string, label: string) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid number for ${label}: ${value}`);
  }
  return parsed;
};

program
  .name("jobs:work")
  .description("Run a background worker that processes jobs")
  .option("--queue <queue>", "Queue name", "default")
  .option(
    "--poll-interval-ms <ms>",
    "How often to poll for new jobs",
    (value) => parseNumber(value, "--poll-interval-ms"),
  )
  .option(
    "--stale-check-interval-ms <ms>",
    "How often to recover stale jobs",
    (value) => parseNumber(value, "--stale-check-interval-ms"),
  )
  .option(
    "--cleanup-interval-ms <ms>",
    "How often to cleanup completed/failed jobs",
    (value) => parseNumber(value, "--cleanup-interval-ms"),
  )
  .option(
    "--lock-duration-ms <ms>",
    "How long to lock a claimed job",
    (value) => parseNumber(value, "--lock-duration-ms"),
  );

program.action(async (options) => {
  const controller = new AbortController();

  process.on("SIGINT", () => {
    console.log("\n[worker] Shutting down...");
    controller.abort();
  });

  process.on("SIGTERM", () => {
    console.log("\n[worker] Shutting down...");
    controller.abort();
  });

  await jobService.runWorker({
    queue: options.queue as string,
    pollIntervalMs: options.pollIntervalMs as number | undefined,
    staleCheckIntervalMs: options.staleCheckIntervalMs as number | undefined,
    cleanupIntervalMs: options.cleanupIntervalMs as number | undefined,
    lockDurationMs: options.lockDurationMs as number | undefined,
    signal: controller.signal,
  });
});

program.showHelpAfterError();
await program.parseAsync(process.argv);
