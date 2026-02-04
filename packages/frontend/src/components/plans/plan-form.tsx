import * as z from "zod";
import { useAppForm } from "@/context/form-context";
import { action, redirect, useAction, useNavigate } from "@solidjs/router";
import { add } from "date-fns";
import { api } from "@/lib/api";
import type { InferDbType } from "@blackwall/database/types";
import { TeamAvatar } from "@/components/custom-ui/avatar";
import { TanStackTextArea, TanStackTextField } from "@/components/ui/text-field";
import { CalendarDate, getLocalTimeZone, parseAbsolute } from "@internationalized/date";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/custom-ui/date-picker";
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

type PlanFormProps = {
  workspaceSlug: string;
  teamKey: string;
  team: InferDbType<"team">;
  title: string;
  buttonText: string;
};

const createPlanAction = action(
  async (
    workspaceSlug: string,
    teamKey: string,
    value: {
      name: string;
      goal: string | null;
      startDate: string;
      endDate: string;
      onUndoneIssues: "moveToBacklog" | "moveToNewPlan";
    },
  ) => {
    await api.api["issue-plans"].teams[":teamKey"].plans.$post({
      param: { teamKey },
      json: {
        name: value.name,
        goal: value.goal,
        startDate: value.startDate,
        endDate: value.endDate,
        onUndoneIssues: value.onUndoneIssues,
      },
    });

    redirect(`/${workspaceSlug}/team/${teamKey}/issues/board`);
  },
);

export function PlanForm(props: PlanFormProps) {
  const _action = useAction(createPlanAction);

  const form = useAppForm(() => ({
    defaultValues: {
      name: "",
      goal: null as string | null,
      startDate: new Date().toISOString(),
      endDate: add(new Date(), { weeks: 2 }).toISOString(),
      onUndoneIssues: "moveToBacklog" as "moveToBacklog" | "moveToNewPlan",
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(1, "Name is required"),
        goal: z.string().nullable(),
        startDate: z.iso.date(),
        endDate: z.iso.date(),
        onUndoneIssues: z.enum(["moveToBacklog", "moveToNewPlan"]),
      }),
    },
    onSubmit: async ({ value }) => {
      await _action(props.workspaceSlug, props.teamKey, value);
    },
  }));

  return (
    <div class="flex flex-col gap-6 mx-auto max-w-2xl p-4 sm:pt-12 sm:pb-12">
      <div class="flex flex-col gap-3 items-center">
        <TeamAvatar team={props.team} size="md" />
        <h1 class="text-xl sm:text-2xl font-medium text-center">{props.title}</h1>
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
              const calendarDate = () => parseAbsolute(field().state.value, getLocalTimeZone());

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
              const calendarDate = () => parseAbsolute(field().state.value, getLocalTimeZone());

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

        <form.AppField name="onUndoneIssues">
          {(field) => (
            <FieldSet>
              <FieldLegend variant="label">On undone issues</FieldLegend>
              <RadioGroup
                value={field().state.value}
                onValueChange={(value) => field().handleChange(value)}
              >
                <FieldLabel for="moveToBacklog">
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>Move to backlog</FieldTitle>
                      <FieldDescription>Move undone issues to the backlog.</FieldDescription>
                    </FieldContent>
                    <RadioGroupItem
                      value="moveToBacklog"
                      id="moveToBacklog"
                      aria-label="Move to backlog"
                    />
                  </Field>
                </FieldLabel>
                <FieldLabel for="moveToNewPlan">
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>Move to new plan</FieldTitle>
                      <FieldDescription>Move undone issues to a new plan.</FieldDescription>
                    </FieldContent>
                    <RadioGroupItem
                      value="moveToNewPlan"
                      id="moveToNewPlan"
                      aria-label="Move to new plan"
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
              <Button type="submit" size="lg" disabled={!state().canSubmit}>
                {props.buttonText}
              </Button>
            </div>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
