import { Command } from "commander";
import { jobService } from "../../features/jobs/job.service";
import "../../jobs/register";

const DEFAULT_POLL_INTERVAL_MS = 1000;
const DEFAULT_STALE_CHECK_INTERVAL_MS = 30_000;
const DEFAULT_CLEANUP_INTERVAL_MS = 60 * 60 * 1000;
const DEFAULT_LOCK_DURATION_MS = 30_000;

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
    DEFAULT_POLL_INTERVAL_MS,
  )
  .option(
    "--stale-check-interval-ms <ms>",
    "How often to recover stale jobs",
    (value) => parseNumber(value, "--stale-check-interval-ms"),
    DEFAULT_STALE_CHECK_INTERVAL_MS,
  )
  .option(
    "--cleanup-interval-ms <ms>",
    "How often to cleanup completed/failed jobs",
    (value) => parseNumber(value, "--cleanup-interval-ms"),
    DEFAULT_CLEANUP_INTERVAL_MS,
  )
  .option(
    "--lock-duration-ms <ms>",
    "How long to lock a claimed job",
    (value) => parseNumber(value, "--lock-duration-ms"),
    DEFAULT_LOCK_DURATION_MS,
  );

let running = true;

process.on("SIGINT", () => {
  console.log("\n[worker] Shutting down...");
  running = false;
});

process.on("SIGTERM", () => {
  console.log("\n[worker] Shutting down...");
  running = false;
});

program.action(async (options) => {
  const queue = options.queue as string;
  const pollIntervalMs = options.pollIntervalMs as number;
  const staleCheckIntervalMs = options.staleCheckIntervalMs as number;
  const cleanupIntervalMs = options.cleanupIntervalMs as number;
  const lockDurationMs = options.lockDurationMs as number;

  console.log(`[worker] Starting worker for queue: ${queue}`);

  let lastStaleCheck = 0;
  let lastCleanup = 0;

  while (running) {
    const now = Date.now();

    if (now - lastStaleCheck > staleCheckIntervalMs) {
      const recovered = await jobService.recoverStaleJobs();
      if (recovered > 0) {
        console.log(`[worker] Recovered ${recovered} stale job(s)`);
      }
      lastStaleCheck = now;
    }

    if (now - lastCleanup > cleanupIntervalMs) {
      await jobService.cleanupJobs();
      lastCleanup = now;
    }

    const job = await jobService.claimJob(queue, lockDurationMs);

    if (!job) {
      await Bun.sleep(pollIntervalMs);
      continue;
    }

    const handler = jobService.getHandler(job.type);

    if (!handler) {
      console.error(`[worker] No handler for job type: ${job.type}`);
      await jobService.failJob(job.id, `No handler registered for job type: ${job.type}`);
      continue;
    }

    console.log(`[worker] Processing ${job.type} (${job.id}), attempt ${job.attempts}`);

    try {
      const payload = JSON.parse(job.payload);
      await handler(payload);
      await jobService.completeJob(job.id);
      console.log(`[worker] Completed ${job.id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      console.error(`[worker] Failed ${job.id}: ${errorMessage}`);
      await jobService.failJob(job.id, errorMessage);
    }
  }

  console.log("[worker] Stopped");
});

program.showHelpAfterError();
await program.parseAsync(process.argv);
