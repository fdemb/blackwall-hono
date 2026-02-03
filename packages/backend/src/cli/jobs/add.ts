import { Command } from "commander";
import { jobService } from "../../features/jobs/job.service";
import { formatJob, parseJsonArg, printJson } from "./_utils";

const program = new Command();

const parseNumber = (value: string, label: string) => {
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid number for ${label}: ${value}`);
  }
  return parsed;
};

program
  .name("jobs:add")
  .description("Add a job to the queue")
  .requiredOption("--type <type>", "Job type")
  .requiredOption("--payload <json>", "Job payload as JSON")
  .option("--queue <queue>", "Queue name")
  .option("--delay-ms <ms>", "Delay in milliseconds", (value) => parseNumber(value, "--delay-ms"))
  .option("--max-attempts <n>", "Max retry attempts", (value) => parseNumber(value, "--max-attempts"));

program.action(async (options) => {
  const payload = parseJsonArg(options.payload, "--payload");

  const job = await jobService.addJob({
    type: options.type,
    payload,
    queue: options.queue,
    delay: options.delayMs,
    maxAttempts: options.maxAttempts,
  });

  printJson({ job: formatJob(job) });
});

program.showHelpAfterError();
await program.parseAsync(process.argv);
