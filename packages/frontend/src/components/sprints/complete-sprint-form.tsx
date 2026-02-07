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

type CompleteSprintFormProps = {
  workspaceSlug: string;
  teamKey: string;
  team: InferDbType<"team">;
  sprint: InferDbType<"issueSprint">;
};

const completeSprintAction = action(
  async (
    workspaceSlug: string,
    teamKey: string,
    sprintId: string,
    value: { onUndoneIssues: "moveToBacklog" | "moveToNewSprint" },
  ) => {
    await api.api["issue-sprints"].teams[":teamKey"].sprints[":sprintId"].complete.$post({
      param: { teamKey, sprintId },
      json: value,
    });

    toast.success("Sprint completed successfully");
    throw redirect(`/${workspaceSlug}/team/${teamKey}/issues/board`);
  },
);

export function CompleteSprintForm(props: CompleteSprintFormProps) {
  const _action = useAction(completeSprintAction);
  const endDateInFuture = () => new Date(props.sprint.endDate).getTime() > Date.now();

  const form = useAppForm(() => ({
    defaultValues: {
      onUndoneIssues: "moveToBacklog" as "moveToBacklog" | "moveToNewSprint",
    },
    validators: {
      onSubmit: z.object({
        onUndoneIssues: z.enum(["moveToBacklog", "moveToNewSprint"]),
      }),
    },
    onSubmit: async ({ value }) => {
      await _action(props.workspaceSlug, props.teamKey, props.sprint.id, value);
    },
  }));

  return (
    <div class="flex flex-col gap-6 mx-auto max-w-2xl p-4 sm:pt-12 sm:pb-12">
      <div class="flex flex-col gap-3 items-center">
        <TeamAvatar team={props.team} size="md" />
        <h1 class="text-xl sm:text-2xl font-medium text-center">
          Complete sprint for {props.team.name}
        </h1>
      </div>

      <div class="flex flex-col gap-4 text-center">
        <p class="text-muted-foreground">
          You are about to complete the sprint "{props.sprint.name}". After completing, you can create a
          new sprint for this team.
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
                        Move undone issues to the backlog for future sprinting.
                      </FieldDescription>
                    </FieldContent>
                    <RadioGroupItem
                      value="moveToBacklog"
                      id="completeMoveToBacklog"
                      aria-label="Move to backlog"
                    />
                  </Field>
                </FieldLabel>
                <FieldLabel for="completeMoveToNewSprint">
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>Keep for next sprint</FieldTitle>
                      <FieldDescription>
                        Leave undone issues active so they can be pulled into the next sprint.
                      </FieldDescription>
                    </FieldContent>
                    <RadioGroupItem
                      value="moveToNewSprint"
                      id="completeMoveToNewSprint"
                      aria-label="Keep for next sprint"
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
                  This sprint ends in the future. Update the end date before completing.
                </p>
              )}
              <Button type="submit" size="lg" disabled={!state().canSubmit || endDateInFuture()}>
                Complete sprint
              </Button>
            </div>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
