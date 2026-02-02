import { AuthCard } from "@/components/blocks/auth";
import { useTheme } from "@/components/settings/use-theme";
import { Button, buttonVariants } from "@/components/ui/button";
import { TanStackTextField } from "@/components/ui/text-field";
import { useAppForm } from "@/context/form-context";
import { authClient } from "@/lib/auth-client";
import { A } from "@solidjs/router";
import * as z from "zod";

export default function SignInPage() {
  const { setThemeToUserPreference } = useTheme();

  const form = useAppForm(() => ({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onSubmit: z.object({
        email: z.email(),
        password: z.string().min(8),
      }),
    },
    onSubmit: async ({ value, formApi }) => {
      await authClient.signIn.email({
        email: value.email,
        password: value.password,
      });
    },
  }));

  return (
    <AuthCard title="Sign in">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
      >
        <div class="flex flex-col gap-6">
          <form.AppField name="email">
            {() => (
              <TanStackTextField
                label="Email address"
                type="email"
                autofocus
                placeholder="Enter your email address..."
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
                  Sign In
                </Button>

                <A href="/signup" class={buttonVariants({ variant: "link" })}>
                  Sign Up
                </A>
              </div>
            )}
          </form.Subscribe>
        </div>
      </form>
    </AuthCard>
  );
}
