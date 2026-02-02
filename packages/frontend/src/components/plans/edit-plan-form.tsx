import * as z from "zod";
import { useAppForm } from "@/context/form-context";
import { useNavigate } from "@solidjs/router";
import { api } from "@/lib/api";
import type { InferDbType } from "@blackwall/backend/src/db/types";
import { TeamAvatar } from "@/components/custom-ui/avatar";
import { TanStackTextArea, TanStackTextField } from "@/components/ui/text-field";
import { CalendarDate, getLocalTimeZone } from "@internationalized/date";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/custom-ui/date-picker";
import { Button } from "@/components/ui/button";

type EditPlanFormProps = {
    workspaceSlug: string;
    teamKey: string;
    team: InferDbType<"team">;
    plan: InferDbType<"issuePlan">;
};

export function EditPlanForm(props: EditPlanFormProps) {
    const navigate = useNavigate();

    const form = useAppForm(() => ({
        defaultValues: {
            name: props.plan.name,
            goal: props.plan.goal,
            startDate: new Date(props.plan.startDate),
            endDate: new Date(props.plan.endDate),
        },
        validators: {
            onSubmit: z.object({
                name: z.string().min(1, "Name is required"),
                goal: z.string().nullable(),
                startDate: z.date(),
                endDate: z.date(),
            }),
        },
        onSubmit: async ({ value }) => {
            await api["issue-plans"].teams[":teamKey"].plans[":planId"].$patch({
                param: { teamKey: props.teamKey, planId: props.plan.id },
                json: {
                    name: value.name,
                    goal: value.goal,
                    startDate: value.startDate,
                    endDate: value.endDate,
                },
            });

            navigate(`/${props.workspaceSlug}/team/${props.teamKey}/issues/board`);
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
                            const calendarDate = () =>
                                new CalendarDate(
                                    field().state.value.getFullYear(),
                                    field().state.value.getMonth() + 1,
                                    field().state.value.getDate(),
                                );

                            return (
                                <div class="flex flex-col gap-2 w-full">
                                    <Label for={field().name}>Start date</Label>
                                    <DatePicker
                                        selected={calendarDate()}
                                        onSelect={(date) => field().handleChange(date.toDate(getLocalTimeZone()))}
                                    />
                                </div>
                            );
                        }}
                    </form.AppField>

                    <form.AppField name="endDate">
                        {(field) => {
                            const calendarDate = () =>
                                new CalendarDate(
                                    field().state.value.getFullYear(),
                                    field().state.value.getMonth() + 1,
                                    field().state.value.getDate(),
                                );

                            return (
                                <div class="flex flex-col gap-2 w-full">
                                    <Label for={field().name}>End date</Label>
                                    <DatePicker
                                        selected={calendarDate()}
                                        onSelect={(date) => field().handleChange(date.toDate(getLocalTimeZone()))}
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
