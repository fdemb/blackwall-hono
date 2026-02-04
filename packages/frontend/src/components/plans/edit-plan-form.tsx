import * as z from "zod";
import { useAppForm } from "@/context/form-context";
import { action, redirect, useAction, useNavigate } from "@solidjs/router";
import { api } from "@/lib/api";
import type { InferDbType } from "@blackwall/database/types";
import { TeamAvatar } from "@/components/custom-ui/avatar";
import { TanStackTextArea, TanStackTextField } from "@/components/ui/text-field";
import { parseDate } from "@internationalized/date";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/custom-ui/date-picker";
import { Button } from "@/components/ui/button";
import type { UpdateIssuePlan } from "@blackwall/backend/src/features/issue-plans/issue-plan.zod";
import { toast } from "../custom-ui/toast";

type EditPlanFormProps = {
  workspaceSlug: string;
  teamKey: string;
  team: InferDbType<"team">;
  plan: InferDbType<"issuePlan">;
};

const updatePlanAction = action(
  async (workspaceSlug: string, teamKey: string, planId: string, value: UpdateIssuePlan) => {
    await api.api["issue-plans"].teams[":teamKey"].plans[":planId"].$patch({
      param: { teamKey, planId },
      json: value,
    });

    toast.success("Plan updated successfully");
    throw redirect(`/${workspaceSlug}/team/${teamKey}/plans/${planId}`);
  },
);

export function EditPlanForm(props: EditPlanFormProps) {
  const _action = useAction(updatePlanAction);

  const form = useAppForm(() => ({
    defaultValues: {
      name: props.plan.name,
      goal: props.plan.goal,
      startDate: parseDate(props.plan.startDate.split("T")[0]).toString(),
      endDate: parseDate(props.plan.endDate.split("T")[0]).toString(),
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(1, "Name is required"),
        goal: z.string().nullable(),
        startDate: z.iso.date(),
        endDate: z.iso.date(),
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
        <h1 class="text-xl sm:text-2xl font-medium text-center">Edit plan</h1>
      </div>

      <form
        class="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.AppField name="name">
          {() => (
            <TanStackTextField
              label="Name"
              placeholder={`e.g. "Q1 2026 improvements", "Feature X"`}
            />
          )}
        </form.AppField>

        <form.AppField name="goal">
          {() => (
            <TanStackTextArea
              label="Goal"
              placeholder="What do you want to achieve?"
              textareaClass="min-h-24"
            />
          )}
        </form.AppField>

        <div class="flex flex-col gap-2 sm:flex-row">
          <form.AppField name="startDate">
            {(field) => {
              const calendarDate = () => parseDate(field().state.value);

              return (
                <div class="flex flex-col gap-2 w-full">
                  <Label for={field().name}>Start date</Label>
                  <DatePicker
                    selected={calendarDate()}
                    onSelect={(date) => field().handleChange(date.toString())}
                  />
                </div>
              );
            }}
          </form.AppField>

          <form.AppField name="endDate">
            {(field) => {
              const calendarDate = () => parseDate(field().state.value);

              return (
                <div class="flex flex-col gap-2 w-full">
                  <Label for={field().name}>End date</Label>
                  <DatePicker
                    selected={calendarDate()}
                    onSelect={(date) => field().handleChange(date.toString())}
                  />
                </div>
              );
            }}
          </form.AppField>
        </div>

        <form.Subscribe>
          {(state) => (
            <div class="flex flex-col gap-2 items-center mt-2">
              <Button type="submit" size="lg" disabled={!state().canSubmit}>
                Save changes
              </Button>
            </div>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
