import { AuthCard } from "@/components/blocks/auth";
import { Button } from "@/components/ui/button";
import { TanStackTextField } from "@/components/ui/text-field";
import { useAppForm } from "@/context/form-context";
import { api } from "@/lib/api";
import { m } from "@/paraglide/messages.js";
import { useNavigate } from "@solidjs/router";
import type { CreateWorkspace } from "@blackwall/backend/src/features/workspaces/workspace.zod";

export default function CreateWorkspacePage() {
  const navigate = useNavigate();

  const form = useAppForm(() => ({
    defaultValues: {
      displayName: "",
      slug: "",
    } satisfies CreateWorkspace,
    onSubmit: async ({ value }) => {
      const res = await api.api.workspaces.create.$post({
        json: value,
      });

      const { workspace } = await res.json();
      navigate(`/${workspace.slug}`);
    },
  }));

  return (
    <AuthCard title={m.either_create_workspace_title()}>
      <form
        class="flex flex-col gap-6"
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <form.AppField name="displayName">
          {() => <TanStackTextField label={m.either_create_workspace_name_label()} />}
        </form.AppField>

        <form.AppField name="slug">
          {() => (
            <TanStackTextField
              label={m.either_create_workspace_url_label()}
              inputClass="pl-[170px]"
              beforeInput={
                <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                  https://blackwallapp.com/
                </span>
              }
            />
          )}
        </form.AppField>

        <Button type="submit" class="w-full">
          {m.either_create_workspace_submit()}
        </Button>
      </form>
    </AuthCard>
  );
}
