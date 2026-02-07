import { hc } from "hono/client";
import type { AppType } from "@blackwall/backend/src/index";
import { getCurrentWorkspaceSlug } from "./workspace-slug";
import { toast } from "@/components/custom-ui/toast";
import { backendUrl } from "./env";

const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const headers = new Headers(init?.headers);
  headers.set("x-blackwall-workspace-slug", getCurrentWorkspaceSlug()!);

  const res = await fetch(input, {
    ...init,
    headers,
  });

  if (res.status === 401) {
    window.location.href = "/signin";
    return res;
  }

  if (!res.ok) {
    const errorText = await res.text();
    if (errorText) {
      console.error(errorText);
      toast.error(errorText);
      throw new Error(errorText);
    }
  }

  return res;
};

const api = hc<AppType>(backendUrl, {
  init: {
    credentials: "include",
  },
  fetch: customFetch,
});

export { api };
