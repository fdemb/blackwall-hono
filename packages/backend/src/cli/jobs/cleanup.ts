import { Command } from "commander";
import { jobService } from "../../features/jobs/job.service";
import { printJson } from "./_utils";

const program = new Command();

const parseNumber = (value: string, label: string) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid number for ${label}: ${value}`);
  }
  return parsed;
};

program
  .name("jobs:cleanup")
  .description("Cleanup old completed and failed jobs")
  .option(
    "--completed-older-than-ms <ms>",
    "Delete completed jobs older than the provided milliseconds",
    (value) => parseNumber(value, "--completed-older-than-ms"),
  )
  .option(
    "--failed-older-than-ms <ms>",
    "Delete failed jobs older than the provided milliseconds",
    (value) => parseNumber(value, "--failed-older-than-ms"),
  );

program.action(async (options) => {
  await jobService.cleanupJobs({
    completedOlderThanMs: options.completedOlderThanMs,
    failedOlderThanMs: options.failedOlderThanMs,
  });

  printJson({ success: true });
});

program.showHelpAfterError();
await program.parseAsync(process.argv);
