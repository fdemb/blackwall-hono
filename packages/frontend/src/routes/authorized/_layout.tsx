import { type ParentComponent, Show, createEffect } from "solid-js";
import { getSession } from "./_layout.data";
import { createAsync } from "@solidjs/router";
import { SessionContext } from "@/context/session-context";
import { applyTheme } from "@/components/settings/use-theme";

const AuthorizedLayout: ParentComponent = (props) => {
  const session = createAsync(() => getSession());

  createEffect(() => {
    const data = session();
    if (data?.user) {
      const theme = data.user.preferredTheme as "system" | "light" | "dark" | undefined;
      if (theme) {
        applyTheme(theme);
      }
    }
  });

  return (
    <Show when={session()}>
      {(session) => (
        <SessionContext.Provider value={session}>{props.children}</SessionContext.Provider>
      )}
    </Show>
  );
};

export default AuthorizedLayout;
