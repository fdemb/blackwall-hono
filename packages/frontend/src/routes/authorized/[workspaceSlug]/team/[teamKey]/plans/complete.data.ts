import { api } from "@/lib/api";
import { query } from "@solidjs/router";

export const activePlanLoader = query(async (teamKey: string) => {
    const res = await api["issue-plans"].teams[":teamKey"].plans.active.$get({
        param: { teamKey },
    });

    if (!res.ok) {
        return null;
    }

    const { plan } = await res.json();
    return plan;
}, "activePlan");
