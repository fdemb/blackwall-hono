import { createColorFromString } from "@blackwall/shared";
import { labelData } from "./label.data";

async function createLabel(input: { name: string; workspaceId: string }) {
    const existingLabel = await labelData.getLabelByName({
        name: input.name,
        workspaceId: input.workspaceId,
    });

    if (existingLabel) {
        throw new Error("Label with this name already exists");
    }

    const colorKey = createColorFromString(input.name);
    return labelData.createLabel({
        name: input.name,
        colorKey,
        workspaceId: input.workspaceId,
    });
}

async function getLabelById(input: { labelId: string; workspaceId: string }) {
    return labelData.getLabelById(input);
}

async function getLabelsForWorkspace(input: { workspaceId: string }) {
    return labelData.getLabelsForWorkspace(input);
}

async function deleteLabel(input: { labelId: string; workspaceId: string }) {
    const label = await labelData.getLabelById(input);
    if (!label) {
        throw new Error("Label not found");
    }

    return labelData.deleteLabel(input);
}

async function addLabelToIssue(input: {
    issueId: string;
    labelId: string;
    workspaceId: string;
    actorId: string;
}) {
    return labelData.addLabelToIssue(input);
}

async function removeLabelFromIssue(input: {
    issueId: string;
    labelId: string;
    workspaceId: string;
    actorId: string;
}) {
    return labelData.removeLabelFromIssue(input);
}

export const labelService = {
    createLabel,
    getLabelById,
    getLabelsForWorkspace,
    deleteLabel,
    addLabelToIssue,
    removeLabelFromIssue,
};
