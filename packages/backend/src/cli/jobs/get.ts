import { Command } from "commander";
import { jobService } from "../../features/jobs/job.service";
import { formatJob, printJson } from "./_utils";

const program = new Command();

program
  .name("jobs:get")
  .description("Get a job by id")
  .requiredOption("--id <jobId>", "Job id");

program.action(async (options) => {
  const job = await jobService.getJobById(options.id);
  if (!job) {
    throw new Error(`Job not found: ${options.id}`);
  }
  printJson({ job: formatJob(job) });
});

program.showHelpAfterError();
await program.parseAsync(process.argv);
