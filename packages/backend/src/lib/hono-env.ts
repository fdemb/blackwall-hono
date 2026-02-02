import type { Workspace } from "../db/schema";
import type { AuthVariables } from "../features/auth/auth-middleware";

export interface AppVariables extends AuthVariables {
  workspace: Workspace;
}

export type AppEnv = {
  Variables: AppVariables;
};
