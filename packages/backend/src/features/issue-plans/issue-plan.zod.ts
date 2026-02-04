import { z } from "zod";

export const createIssuePlanSchema = z.object({
  name: z.string().min(1).max(100),
  goal: z.string().max(500).nullable(),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  onUndoneIssues: z.enum(["moveToBacklog", "moveToNewPlan"]),
});

export type CreateIssuePlan = z.infer<typeof createIssuePlanSchema>;

import { issueSchema } from "../issues/issue.zod";

export const updateIssuePlanSchema = z.object({
  name: z.string().min(1).max(100),
  goal: z.string().max(500).nullable(),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
});

export type UpdateIssuePlan = z.infer<typeof updateIssuePlanSchema>;

export const issuePlanParamsSchema = z.object({
  teamKey: z.string(),
  planId: z.string().optional(),
});

export const issuePlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  goal: z.string().nullable(),
  startDate: z.iso.date(),
  endDate: z.iso.date(),
  teamId: z.string(),
  createdById: z.string(),
  status: z.string().optional(), // active, completed, etc. if exists
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const issuePlanListSchema = z.object({
  plans: z.array(issuePlanSchema),
});

export const issuePlanResponseSchema = z.object({
  plan: issuePlanSchema,
});

export const issuePlanWithIssuesSchema = z.object({
  plan: issuePlanSchema,
  issues: z.array(issueSchema),
});
