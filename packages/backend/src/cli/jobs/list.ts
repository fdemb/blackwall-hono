import { Command } from "commander";
import type { JobStatus } from "../../db/schema/job.schema";
import { jobStatusValues } from "../../db/schema/job.schema";
import { jobService } from "../../features/jobs/job.service";
import { formatJob, printJson } from "./_utils";

const program = new Command();

const parseNumber = (value: string, label: string) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid number for ${label}: ${value}`);
  }
  return parsed;
};

program
  .name("jobs:list")
  .description("List jobs in the queue")
  .option("--queue <queue>", "Queue name")
  .option("--status <status>", `Job status (${jobStatusValues.join(", ")})`)
  .option("--limit <n>", "Limit number of jobs", (value) => parseNumber(value, "--limit"));

program.action(async (options) => {
  const statusRaw = options.status as string | undefined;
  if (statusRaw && !jobStatusValues.includes(statusRaw as JobStatus)) {
    throw new Error(`Invalid --status. Expected one of: ${jobStatusValues.join(", ")}`);
  }

  const jobs = await jobService.listJobs({
    queue: options.queue,
    status: statusRaw as JobStatus | undefined,
    limit: options.limit,
  });

  printJson({ jobs: jobs.map(formatJob) });
});

program.showHelpAfterError();
await program.parseAsync(process.argv);
