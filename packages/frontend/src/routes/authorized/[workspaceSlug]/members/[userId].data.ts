import { api } from "@/lib/api";
import { query } from "@solidjs/router";

export const memberDetailLoader = query(async (slug: string, userId: string) => {
  const res = await api.api.workspaces[":slug"].members[":userId"].$get({
    param: {
      slug,
      userId,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch member details");
  }

  const { member } = await res.json();
  return member;
}, "memberDetail");
