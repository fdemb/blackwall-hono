import { Command } from "commander";
import { jobService } from "../../features/jobs/job.service";
import { printJson } from "./_utils";

const program = new Command();

program.name("jobs:recover-stale").description("Recover stale jobs");

program.action(async () => {
  const recovered = await jobService.recoverStaleJobs();
  printJson({ recovered });
});

program.showHelpAfterError();
await program.parseAsync(process.argv);
