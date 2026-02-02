import { api } from "@/lib/api";
import { query } from "@solidjs/router";

export const teamsSettingsLoader = query(async () => {
  const res = await api.settings.teams.$get();

  if (!res.ok) {
    throw new Error("Failed to fetch teams");
  }

  const { teams } = await res.json();
  return teams;
}, "teamsSettings");
