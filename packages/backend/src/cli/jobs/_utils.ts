import type { Job } from "../../db/schema/job.schema";

function parseJsonArg(value: string, label: string) {
  try {
    return JSON.parse(value);
  } catch (error) {
    throw new Error(`Invalid JSON for ${label}: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function formatJob(job: Job) {
  if (typeof job.payload === "string") {
    try {
      return { ...job, payload: JSON.parse(job.payload) };
    } catch {
      return job;
    }
  }
  return job;
}

function printUsage(usage: string) {
  console.log(usage.trim());
}

function printJson(value: unknown) {
  console.log(JSON.stringify(value, null, 2));
}

function exitWithError(message: string, usage?: string) {
  console.error(message);
  if (usage) {
    console.error("");
    console.error(usage.trim());
  }
  process.exit(1);
}

export {
  parseJsonArg,
  formatJob,
  printUsage,
  printJson,
  exitWithError,
};
