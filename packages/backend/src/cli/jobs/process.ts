import { Command } from "commander";
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
  .name("jobs:process")
  .description("Claim and process the next job in a queue")
  .requiredOption("--queue <queue>", "Queue name")
  .option(
    "--lock-duration-ms <ms>",
    "Lock duration in milliseconds",
    (value) => parseNumber(value, "--lock-duration-ms"),
  );

program.action(async (options) => {
  const result = await jobService.processJob(options.queue, options.lockDurationMs);

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
    process.exitCode = 1;
  }
});

program.showHelpAfterError();
await program.parseAsync(process.argv);
