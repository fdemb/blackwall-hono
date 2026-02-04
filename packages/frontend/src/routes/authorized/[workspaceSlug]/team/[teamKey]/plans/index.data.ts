import { api } from "@/lib/api";
import { query } from "@solidjs/router";

export const plansLoader = query(async (teamKey: string) => {
  const res = await api.api["issue-plans"].teams[":teamKey"].plans.$get({
    param: { teamKey },
  });

  if (!res.ok) {
    throw new Error("Failed to load plans");
  }

  const { plans } = await res.json();
  return plans;
}, "plans");
