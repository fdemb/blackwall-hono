import { api } from "@/lib/api";
import { query } from "@solidjs/router";

export const planDetailLoader = query(async (teamKey: string, planId: string) => {
  const res = await api.api["issue-plans"].teams[":teamKey"].plans[":planId"].$get({
    param: { teamKey, planId },
  });

  if (!res.ok) {
    throw new Error("Plan not found");
  }

  return await res.json(); // { plan, issues }
}, "planDetail");
