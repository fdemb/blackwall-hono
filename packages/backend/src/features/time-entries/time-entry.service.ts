import { timeEntryData } from "./time-entry.data";
import { BadRequestError, NotFoundError } from "../../lib/errors";

async function createTimeEntry(input: {
    issueId: string;
    workspaceId: string;
    userId: string;
    duration: number;
    description?: string;
}) {
    if (input.duration <= 0) {
        throw new BadRequestError("Duration must be positive");
    }

    return timeEntryData.createTimeEntry(input);
}

async function listTimeEntriesForIssue(input: { issueId: string }) {
    return timeEntryData.listTimeEntriesForIssue(input);
}

async function deleteTimeEntry(input: {
    timeEntryId: string;
    issueId: string;
    userId: string;
}) {
    const entry = await timeEntryData.getTimeEntryById({
        timeEntryId: input.timeEntryId,
        issueId: input.issueId,
    });

    if (!entry) {
        throw new NotFoundError("Time entry not found");
    }

    await timeEntryData.softDeleteTimeEntry({ timeEntryId: input.timeEntryId });
}

async function getTotalTimeLoggedForIssue(input: { issueId: string }) {
    return timeEntryData.getTotalTimeLoggedForIssue(input);
}

export const timeEntryService = {
    createTimeEntry,
    listTimeEntriesForIssue,
    deleteTimeEntry,
    getTotalTimeLoggedForIssue,
};
