import { AuthCard } from "@/components/blocks/auth";
import { Button, buttonVariants } from "@/components/ui/button";
import { TanStackTextField } from "@/components/ui/text-field";
import { useAppForm } from "@/context/form-context";
import { api } from "@/lib/api";
import { validateFields } from "@/lib/form.utils";
import { A, action, redirect, useAction } from "@solidjs/router";
import { createSignal, Match, Switch } from "solid-js";
import * as z from "zod";

type SignupFormData = {
  name: string;
  email: string;
  password: string;
  workspaceDisplayName: string;
  workspaceUrlSlug: string;
};

type SignUpFormApi = ReturnType<typeof useSignupForm>;

const signupAction = action(async (value: SignupFormData) => {
  const res = await api.api.auth.signup.email.$post({
    json: value,
  });

  const json = await res.json();
  throw redirect(`/${json.workspace.slug}`);
});

const useSignupForm = () => {
  const _action = useAction(signupAction);
  const form = useAppForm(() => ({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      workspaceDisplayName: "",
      workspaceUrlSlug: "",
    },
    onSubmit: async ({ value, formApi }) => {
      await _action(value);
      formApi.reset();
    },
  }));

  return form;
};

export default function SignupPage() {
  const [step, setStep] = createSignal<"account" | "workspace">("account");
  const form = useSignupForm();

  return (
    <AuthCard title="Sign up">
      <Switch>
        <Match when={step() === "account"}>
          <AccountForm
            form={form}
            onContinue={() => {
              setStep("workspace");
            }}
          />
        </Match>
        <Match when={step() === "workspace"}>
          <WorkspaceForm
            form={form}
            onBack={() => setStep("account")}
            onContinue={() => {
              form.handleSubmit();
            }}
          />
        </Match>
      </Switch>
    </AuthCard>
  );
}

function AccountForm(props: { form: SignUpFormApi; onContinue: () => void }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();

        const errors = validateFields(props.form, ["email", "password", "name"]);

        if (errors.length === 0) {
          props.onContinue();
        }
      }}
    >
      <div class="flex flex-col gap-6">
        <props.form.AppField
          name="email"
          validators={{
            onBlur: z.email(),
          }}
        >
          {() => (
            <TanStackTextField
              label="Email address"
              inputClass="p-3 h-auto !text-base"
              type="email"
              placeholder="john.doe@example.com"
              autofocus
              autocomplete="email"
            />
          )}
        </props.form.AppField>

        <props.form.AppField
          name="password"
          validators={{
            onBlur: z.string().min(8),
          }}
        >
          {() => (
            <TanStackTextField
              label="Password"
              inputClass="p-3 h-auto !text-base"
              type="password"
              placeholder="Tip: use a password generator"
              autocomplete="new-password"
            />
          )}
        </props.form.AppField>

        <props.form.AppField
          name="name"
          validators={{
            onBlur: z.string().min(2).max(100),
          }}
        >
          {() => (
            <TanStackTextField
              label="Full Name"
              inputClass="p-3 h-auto !text-base"
              type="text"
              placeholder="John Doe"
              autocomplete="name"
            />
          )}
        </props.form.AppField>

        <div class="flex flex-col gap-2">
          <props.form.Subscribe>
            {(state) => (
              <Button
                type="submit"
                size="lg"
                class="text-base"
                disabled={!state().canSubmit || state().isSubmitting}
              >
                Continue
              </Button>
            )}
          </props.form.Subscribe>

          <A href="/signin" class={buttonVariants({ variant: "link" })}>
            Back to login
          </A>
        </div>
      </div>
    </form>
  );
}

function WorkspaceForm(props: { form: SignUpFormApi; onBack: () => void; onContinue: () => void }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        props.onContinue();
      }}
    >
      <div class="flex flex-col gap-6">
        <props.form.AppField
          name="workspaceDisplayName"
          validators={{
            onBlur: z.string().min(3).max(64),
          }}
        >
          {() => (
            <TanStackTextField
              label="Workspace Name"
              inputClass="p-3 w-72 h-auto !text-base"
              type="text"
              placeholder="Awesome workspace"
              autofocus
            />
          )}
        </props.form.AppField>

        <props.form.AppField
          name="workspaceUrlSlug"
          validators={{
            onBlur: z.string().min(3).max(64),
          }}
        >
          {() => (
            <TanStackTextField
              label="Workspace URL"
              inputClass="p-3 w-72 h-auto !text-base"
              type="text"
              placeholder="URL slug, e.g. awesome-workspace"
            />
          )}
        </props.form.AppField>

        <div class="flex flex-col gap-2">
          <Button type="submit" size="lg" class="text-base">
            Continue
          </Button>

          <Button type="button" variant="link" onClick={() => props.onBack()}>
            Back to account details
          </Button>
        </div>
      </div>
    </form>
  );
}
