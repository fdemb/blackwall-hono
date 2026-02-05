import * as z from "zod";
import { useAppForm } from "@/context/form-context";
import { action, redirect, useAction } from "@solidjs/router";
import { api } from "@/lib/api";
import type { InferDbType } from "@blackwall/database/types";
import { TeamAvatar } from "@/components/custom-ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "../custom-ui/toast";

type CompletePlanFormProps = {
  workspaceSlug: string;
  teamKey: string;
  team: InferDbType<"team">;
  plan: InferDbType<"issuePlan">;
};

const completePlanAction = action(
  async (
    workspaceSlug: string,
    teamKey: string,
    planId: string,
    value: { onUndoneIssues: "moveToBacklog" | "moveToNewPlan" },
  ) => {
    await api.api["issue-plans"].teams[":teamKey"].plans[":planId"].complete.$post({
      param: { teamKey, planId },
      json: value,
    });

    toast.success("Plan completed successfully");
    throw redirect(`/${workspaceSlug}/team/${teamKey}/issues/board`);
  },
);

export function CompletePlanForm(props: CompletePlanFormProps) {
  const _action = useAction(completePlanAction);
  const endDateInFuture = () => new Date(props.plan.endDate).getTime() > Date.now();

  const form = useAppForm(() => ({
    defaultValues: {
      onUndoneIssues: "moveToBacklog" as "moveToBacklog" | "moveToNewPlan",
    },
    validators: {
      onSubmit: z.object({
        onUndoneIssues: z.enum(["moveToBacklog", "moveToNewPlan"]),
      }),
    },
    onSubmit: async ({ value }) => {
      await _action(props.workspaceSlug, props.teamKey, props.plan.id, value);
    },
  }));

  return (
    <div class="flex flex-col gap-6 mx-auto max-w-2xl p-4 sm:pt-12 sm:pb-12">
      <div class="flex flex-col gap-3 items-center">
        <TeamAvatar team={props.team} size="md" />
        <h1 class="text-xl sm:text-2xl font-medium text-center">
          Complete plan for {props.team.name}
        </h1>
      </div>

      <div class="flex flex-col gap-4 text-center">
        <p class="text-muted-foreground">
          You are about to complete the plan "{props.plan.name}". After completing, you can create a
          new plan for this team.
        </p>
        <p class="text-muted-foreground text-sm">
          Choose what happens to any undone issues before you finish.
        </p>
      </div>

      <form
        class="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.AppField name="onUndoneIssues">
          {(field) => (
            <FieldSet>
              <FieldLegend variant="label">On undone issues</FieldLegend>
              <RadioGroup
                value={field().state.value}
                onValueChange={(value) => field().handleChange(value)}
              >
                <FieldLabel for="completeMoveToBacklog">
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>Move to backlog</FieldTitle>
                      <FieldDescription>
                        Move undone issues to the backlog for future planning.
                      </FieldDescription>
                    </FieldContent>
                    <RadioGroupItem
                      value="moveToBacklog"
                      id="completeMoveToBacklog"
                      aria-label="Move to backlog"
                    />
                  </Field>
                </FieldLabel>
                <FieldLabel for="completeMoveToNewPlan">
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>Keep for next plan</FieldTitle>
                      <FieldDescription>
                        Leave undone issues active so they can be pulled into the next plan.
                      </FieldDescription>
                    </FieldContent>
                    <RadioGroupItem
                      value="moveToNewPlan"
                      id="completeMoveToNewPlan"
                      aria-label="Keep for next plan"
                    />
                  </Field>
                </FieldLabel>
              </RadioGroup>
            </FieldSet>
          )}
        </form.AppField>

        <form.Subscribe>
          {(state) => (
            <div class="flex flex-col gap-2 items-center mt-2">
              {endDateInFuture() && (
                <p class="text-sm text-muted-foreground text-center">
                  This plan ends in the future. Update the end date before completing.
                </p>
              )}
              <Button
                type="submit"
                size="lg"
                disabled={!state().canSubmit || endDateInFuture()}
              >
                Complete plan
              </Button>
            </div>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
