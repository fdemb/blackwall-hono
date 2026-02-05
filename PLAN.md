# Plans Feature Readiness Plan (Optimize For Timeboxed Sprints)

## Context
We are optimizing the plans feature for timeboxed sprints with exactly one active plan per team at any time.

## Target Workflow
1. Team creates a new plan (sprint) with start and end dates.
2. Plan becomes the active plan.
3. Issues are assigned to the active plan and worked until done.
4. Completing a plan moves undone work based on a chosen policy and clears the active plan.
5. A new plan can be created immediately after completion.

## Major Gaps (Current State)
- Completing a plan has no undone-issues handling, so in-progress work can remain stuck in a finished plan.
- There is no visible UI action to complete a plan from the plan detail or list.
- The UI does not surface plan status (active vs completed) in the list or detail pages.
- Plan date validation is missing (end date can be before start date).
- There is no way to delete or archive a plan if created by mistake.
- Issues can only be assigned to the active plan, which blocks pre-planning.

## Scope Decisions (Optimize For Workflow #1)
- Keep exactly one active plan per team.
- Allow assigning issues only to the active plan (no pre-planning) to keep the workflow simple.
- Add explicit completion flow and handling for undone issues.
- Add clear status presentation and basic guardrails.

## MVP Changes
1. Completion flow with undone-issues handling.
2. “Complete plan” action available from plan detail and list.
3. Display plan status and progress clearly.
4. Validate plan dates on create and update.
5. Add “archive” (or delete) capability for plans that are not active.

## Detailed Tasks
- [ ] Add completion policy UI to the complete plan flow: move undone issues to backlog or keep in new plan.
- [ ] Update completion API to accept the policy and apply it consistently.
- [ ] Add a “Complete plan” button in plan detail and a menu action in plan list.
- [ ] Show status badge for active/completed plans in list and detail.
- [ ] Prevent completing a plan with end date in the future (optional guardrail).
- [ ] Add server-side validation: endDate must be on/after startDate.
- [ ] Add plan archive or delete API and UI, restricted to non-active plans.
- [ ] Add basic empty states and confirmations for completion and archive.

## Acceptance Criteria
1. A user can complete a plan from the plan detail page.
2. On completion, undone issues are moved per the selected policy.
3. The team has no active plan after completion.
4. Plan list shows which plan is active and which are completed.
5. Creating or editing a plan rejects invalid date ranges.
6. A non-active plan can be archived or deleted with confirmation.

## Notes
- This plan intentionally avoids multi-plan pre-planning to keep the sprint workflow tight.
- If pre-planning becomes important later, we can revisit allowing multiple future plans.
