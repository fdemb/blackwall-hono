import { api } from "@/lib/api";
import { query } from "@solidjs/router";

export const teamSettingsLoader = query(async (teamKey: string) => {
  const res = await api.api.settings.teams[":teamKey"].$get({
    param: { teamKey },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch team");
  }

  return res.json();
}, "teamSettings");

export const availableUsersLoader = query(async (teamKey: string) => {
  const res = await api.api.settings.teams[":teamKey"]["available-users"].$get({
    param: { teamKey },
  });

  if (!res.ok) {
    throw new Error("Failed to fetch available users");
  }

  const { users } = await res.json();
  return users;
}, "availableUsers");
