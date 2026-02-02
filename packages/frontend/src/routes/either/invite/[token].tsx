import { AuthCard } from "@/components/blocks/auth";
import { Button } from "@/components/ui/button";
import { TanStackTextField } from "@/components/ui/text-field";
import { useAppForm } from "@/context/form-context";
import { api } from "@/lib/api";
import { createAsync, useNavigate, useParams } from "@solidjs/router";
import * as z from "zod";
import { invitationLoader } from "./[token].data";

export default function InvitePage() {
  const params = useParams();
  const navigate = useNavigate();
  const invitation = createAsync(() => invitationLoader(params.token!));

  const form = useAppForm(() => ({
    defaultValues: {
      name: "",
      password: "",
    },
    validators: {
      onSubmit: z.object({
        name: z.string().min(2, "Name is required"),
        password: z.string().min(8, "Password must be at least 8 characters"),
      }),
    },
    onSubmit: async ({ value, formApi }) => {
      const res = await api.invitations[":token"].register.$post({
        param: { token: params.token! },
        json: value,
      });

      if (!res.ok) {
        const error = await res.json();
        formApi.setErrorMap({
          // @ts-expect-error TODO - change to some result type or error wrapper that handles this
          onSubmit: error.error || "Failed to join workspace",
        });
        return;
      }

      navigate("/");
    },
  }));

  return (
    <div>
      <AuthCard title={`Join ${invitation()?.workspace.displayName}`}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
        >
          <div class="flex flex-col gap-6">
            <form.AppField name="name">
              {() => (
                <TanStackTextField
                  label="Name"
                  autofocus
                  placeholder="Enter your full name..."
                  inputClass="p-3 h-auto !text-base"
                />
              )}
            </form.AppField>

            <form.AppField name="password">
              {() => (
                <TanStackTextField
                  label="Password"
                  type="password"
                  placeholder="Your secure password..."
                  inputClass="p-3 h-auto !text-base"
                />
              )}
            </form.AppField>

            <form.Subscribe>
              {(state) => (
                <div class="flex flex-col gap-2">
                  <Button type="submit" size="lg" class="text-base" disabled={!state().canSubmit}>
                    Join Workspace
                  </Button>
                </div>
              )}
            </form.Subscribe>
          </div>
        </form>
      </AuthCard>
    </div>
  );
}
