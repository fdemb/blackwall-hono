import { authClient } from "@/lib/auth-client";
import { query, redirect } from "@solidjs/router";

export const redirectIfSession = query(async () => {
  const session = await authClient.getSession();

  if (session.error) {
    throw new Error(session.error.message);
  }

  if (session.data) {
    throw redirect("/");
  }

  return session.data;
}, "redirect-if-session");
