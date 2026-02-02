import type { ParentComponent } from "solid-js";
import { getSession } from "./_layout.data";
import { createAsync } from "@solidjs/router";
import { SessionContext } from "@/context/session-context";

const AuthorizedLayout: ParentComponent = (props) => {
  const session = createAsync(() => getSession());
  const sessionAccessor = () => session()!;

  return (
    <SessionContext.Provider value={sessionAccessor}>{props.children}</SessionContext.Provider>
  );
};

export default AuthorizedLayout;
