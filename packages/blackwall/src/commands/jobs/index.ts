import { jobService, type JobStatus, jobStatusValues } from "@blackwall/queue";
import { formatJob, parseJsonArg, parseNumber, printJson } from "./utils";

interface AddOptions {
  type: string;
  payload: string;
  queue?: string;
  delayMs?: string;
  maxAttempts?: string;
}

export async function add(options: AddOptions) {
  const payload = parseJsonArg(options.payload, "--payload");

  const job = await jobService.addJob({
    type: options.type,
    payload,
    queue: options.queue,
    delay: options.delayMs ? parseNumber(options.delayMs, "--delay-ms") : undefined,
    maxAttempts: options.maxAttempts ? parseNumber(options.maxAttempts, "--max-attempts") : undefined,
  });

  printJson({ job: formatJob(job) });
}

interface StatsOptions {
  queue?: string;
}

export async function stats(options: StatsOptions) {
  const result = await jobService.getJobStats(options.queue);
  printJson({ stats: result });
}

interface ListOptions {
  queue?: string;
  status?: string;
  limit?: string;
}

export async function list(options: ListOptions) {
  const statusRaw = options.status as string | undefined;
  if (statusRaw && !jobStatusValues.includes(statusRaw as JobStatus)) {
    throw new Error(`Invalid --status. Expected one of: ${jobStatusValues.join(", ")}`);
  }

  const jobs = await jobService.listJobs({
    queue: options.queue,
    status: statusRaw as JobStatus | undefined,
    limit: options.limit ? parseNumber(options.limit, "--limit") : undefined,
  });

  printJson({ jobs: jobs.map(formatJob) });
}

interface GetOptions {
  id: string;
}

export async function get(options: GetOptions) {
  const job = await jobService.getJobById(options.id);
  if (!job) {
    throw new Error(`Job not found: ${options.id}`);
  }
  printJson({ job: formatJob(job) });
}

interface ProcessOptions {
  queue: string;
  lockDurationMs?: string;
}

export async function processJob(options: ProcessOptions) {
  const result = await jobService.processNextJob({
    queue: options.queue,
    lockDurationMs: options.lockDurationMs ? parseNumber(options.lockDurationMs, "--lock-duration-ms") : undefined,
  });

  if (!result) {
    printJson({ processed: false });
    return;
  }

  const payload = {
    processed: true,
    success: result.success,
    job: formatJob(result.job),
    error: result.error,
  };

  printJson(payload);
  if (!result.success) {
    globalThis.process.exitCode = 1;
  }
}

export async function recoverStale() {
  const recovered = await jobService.recoverStaleJobs();
  printJson({ recovered });
}

interface CleanupOptions {
  completedOlderThanMs?: string;
  failedOlderThanMs?: string;
}

export async function cleanup(options: CleanupOptions) {
  await jobService.cleanupJobs({
    completedOlderThanMs: options.completedOlderThanMs
      ? parseNumber(options.completedOlderThanMs, "--completed-older-than-ms")
      : undefined,
    failedOlderThanMs: options.failedOlderThanMs
      ? parseNumber(options.failedOlderThanMs, "--failed-older-than-ms")
      : undefined,
  });

  printJson({ success: true });
}
