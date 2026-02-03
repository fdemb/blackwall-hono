import { Command } from "commander";
import { jobService } from "../../features/jobs/job.service";
import { printJson } from "./_utils";

const program = new Command();

program
  .name("jobs:stats")
  .description("Get job queue statistics")
  .option("--queue <queue>", "Queue name");

program.action(async (options) => {
  const stats = await jobService.getJobStats(options.queue);
  printJson({ stats });
});

program.showHelpAfterError();
await program.parseAsync(process.argv);
