import { useAppForm } from "@/context/form-context";
import { useNavigate } from "@solidjs/router";
import { api } from "@/lib/api";
import type { InferDbType } from "@blackwall/database/types";
import { TeamAvatar } from "@/components/custom-ui/avatar";
import { Button } from "@/components/ui/button";

type CompletePlanFormProps = {
  workspaceSlug: string;
  teamKey: string;
  team: InferDbType<"team">;
  plan: InferDbType<"issuePlan">;
};

export function CompletePlanForm(props: CompletePlanFormProps) {
  const navigate = useNavigate();

  const form = useAppForm(() => ({
    defaultValues: {},
    onSubmit: async () => {
      await api.api["issue-plans"].teams[":teamKey"].plans[":planId"].complete.$post({
        param: { teamKey: props.teamKey, planId: props.plan.id },
      });

      navigate(`/${props.workspaceSlug}/team/${props.teamKey}/plans/create`);
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
      </div>

      <form
        class="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.Subscribe>
          {(state) => (
            <div class="flex flex-col gap-2 items-center mt-2">
              <Button type="submit" size="lg" disabled={!state().canSubmit}>
                Complete plan
              </Button>
            </div>
          )}
        </form.Subscribe>
      </form>
    </div>
  );
}
