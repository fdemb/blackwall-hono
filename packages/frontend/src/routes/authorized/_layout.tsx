import { type ParentComponent, Show } from "solid-js";
import { getSession } from "./_layout.data";
import { createAsync } from "@solidjs/router";
import { SessionContext } from "@/context/session-context";

const AuthorizedLayout: ParentComponent = (props) => {
  const session = createAsync(() => getSession());

  return (
    <Show when={session()}>
      {(session) => (
        <SessionContext.Provider value={session}>{props.children}</SessionContext.Provider>
      )}
    </Show>
  );
};

export default AuthorizedLayout;
