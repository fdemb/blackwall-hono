/* @refresh reload */
import { render } from "solid-js/web";
import { Navigate, Route, Router } from "@solidjs/router";
import "../assets/styles/globals.css";
import { KeybindProvider } from "./context/keybind.context";
import type { ParentComponent } from "solid-js";
import { lazy } from "solid-js";

import { redirectIfSession } from "./routes/guest/_layout.data";
import { redirectToPreferredWorkspace } from "./routes/authorized/index.data";
import { getSession } from "./routes/authorized/_layout.data";
import { workspaceLoader } from "./routes/authorized/[workspaceSlug].data";
import { teamLoader } from "./routes/authorized/[workspaceSlug]/team/[teamKey].data";
import { invitationLoader } from "./routes/either/invite/[token].data";
import { backlogLoader } from "./routes/authorized/[workspaceSlug]/team/[teamKey]/issues/backlog.data";
import { activeIssuesLoader } from "./routes/authorized/[workspaceSlug]/team/[teamKey]/issues/active.data";
import { boardLoader } from "./routes/authorized/[workspaceSlug]/team/[teamKey]/issues/board.data";
import { issueLoader } from "./routes/authorized/[workspaceSlug]/issue/[key].data";
import { myIssuesLoader } from "./routes/authorized/[workspaceSlug]/my-issues.data";
import { plansLoader } from "./routes/authorized/[workspaceSlug]/team/[teamKey]/plans/index.data";
import { activePlanLoader } from "./routes/authorized/[workspaceSlug]/team/[teamKey]/plans/complete.data";
import { planDetailLoader } from "./routes/authorized/[workspaceSlug]/team/[teamKey]/plans/[planId]/index.data";
import { membersLoader } from "./routes/authorized/[workspaceSlug]/members/index.data";
import { memberDetailLoader } from "./routes/authorized/[workspaceSlug]/members/[userId].data";
import { workspaceMembersLoader } from "./routes/authorized/[workspaceSlug]/settings/workspace.data";
import { teamsSettingsLoader } from "./routes/authorized/[workspaceSlug]/settings/teams/index.data";
import { teamSettingsLoader } from "./routes/authorized/[workspaceSlug]/settings/teams/[teamKey].data";
import { Toaster } from "./components/custom-ui/toast";

const HomePage = lazy(() => import("./routes/authorized/index"));
const SomePage = lazy(() => import("./routes/authorized/[workspaceSlug]/index"));
const IssueDetailPage = lazy(() => import("./routes/authorized/[workspaceSlug]/issue/[key]"));
const MyIssuesPage = lazy(() => import("./routes/authorized/[workspaceSlug]/my-issues"));
const ActiveIssuesPage = lazy(
  () => import("./routes/authorized/[workspaceSlug]/team/[teamKey]/issues/active"),
);
const BacklogPage = lazy(
  () => import("./routes/authorized/[workspaceSlug]/team/[teamKey]/issues/backlog"),
);
const BoardPage = lazy(
  () => import("./routes/authorized/[workspaceSlug]/team/[teamKey]/issues/board"),
);
const WorkspaceProvider = lazy(() => import("./routes/authorized/[workspaceSlug]"));
const MainLayout = lazy(() => import("./routes/authorized/[workspaceSlug]/_main"));
const AuthorizedLayout = lazy(() => import("./routes/authorized/_layout"));
const GuestLayout = lazy(() => import("./routes/guest/_layout"));
const SignInPage = lazy(() => import("./routes/guest/signin"));
const SignupPage = lazy(() => import("./routes/guest/signup"));
const TeamLayout = lazy(() => import("./routes/authorized/[workspaceSlug]/team/[teamKey]"));
const CreateWorkspacePage = lazy(() => import("./routes/either/create-workspace"));
const InvitePage = lazy(() => import("./routes/either/invite/[token]"));
const PlansPage = lazy(
  () => import("./routes/authorized/[workspaceSlug]/team/[teamKey]/plans/index"),
);
const CreatePlanPage = lazy(
  () => import("./routes/authorized/[workspaceSlug]/team/[teamKey]/plans/create"),
);
const CompletePlanPage = lazy(
  () => import("./routes/authorized/[workspaceSlug]/team/[teamKey]/plans/complete"),
);
const PlanDetailPage = lazy(
  () => import("./routes/authorized/[workspaceSlug]/team/[teamKey]/plans/[planId]/index"),
);
const EditPlanPage = lazy(
  () => import("./routes/authorized/[workspaceSlug]/team/[teamKey]/plans/[planId]/edit"),
);
const MembersPage = lazy(() => import("./routes/authorized/[workspaceSlug]/members/index"));
const MemberDetailPage = lazy(() => import("./routes/authorized/[workspaceSlug]/members/[userId]"));
const SettingsLayout = lazy(() => import("./routes/authorized/[workspaceSlug]/settings/_layout"));
const SettingsIndexPage = lazy(() => import("./routes/authorized/[workspaceSlug]/settings/index"));
const GeneralSettingsPage = lazy(
  () => import("./routes/authorized/[workspaceSlug]/settings/general"),
);
const ProfileSettingsPage = lazy(
  () => import("./routes/authorized/[workspaceSlug]/settings/profile"),
);
const WorkspaceSettingsPage = lazy(
  () => import("./routes/authorized/[workspaceSlug]/settings/workspace"),
);
const TeamsSettingsPage = lazy(
  () => import("./routes/authorized/[workspaceSlug]/settings/teams/index"),
);
const CreateTeamPage = lazy(
  () => import("./routes/authorized/[workspaceSlug]/settings/teams/create"),
);
const TeamDetailPage = lazy(
  () => import("./routes/authorized/[workspaceSlug]/settings/teams/[teamKey]"),
);

const Root: ParentComponent = (props) => {
  return (
    <>
      <Toaster />
      <KeybindProvider>{props.children}</KeybindProvider>
    </>
  );
};

const AppRouter = () => (
  <Router root={Root}>
    <Route path="*404" component={() => "Not found"} />

    <Route path="/" component={GuestLayout} preload={() => redirectIfSession()}>
      <Route path="/signin" component={SignInPage} />
      <Route path="/signup" component={SignupPage} />
    </Route>

    <Route path="/create-workspace" component={CreateWorkspacePage} />
    <Route
      path="/invite/:token"
      component={InvitePage}
      preload={({ params }) => invitationLoader(params.token!)}
    />

    <Route path="/" component={AuthorizedLayout} preload={() => getSession()}>
      <Route path="/" component={HomePage} preload={() => redirectToPreferredWorkspace()} />
      <Route
        path="/:workspaceSlug"
        component={WorkspaceProvider}
        preload={({ params }) => workspaceLoader(params.workspaceSlug!)}
      >
        <Route path="/" component={MainLayout}>
          <Route path="/" component={SomePage} />
          <Route
            path="/issue/:key"
            component={IssueDetailPage}
            preload={({ params }) => issueLoader(params.key!, params.workspaceSlug!)}
          />
          <Route
            path="/my-issues"
            component={MyIssuesPage}
            preload={({ params }) => myIssuesLoader({ workspaceSlug: params.workspaceSlug! })}
          />
          <Route
            path="/team/:teamKey"
            component={TeamLayout}
            preload={({ params }) => teamLoader(params.teamKey!)}
          >
            <Route
              path="/issues"
              component={(props) => (
                <Navigate
                  href={`/${props.params.workspaceSlug}/team/${props.params.teamKey}/issues/active`}
                />
              )}
            />
            <Route
              path="/issues/active"
              component={ActiveIssuesPage}
              preload={({ params }) => activeIssuesLoader(params.teamKey!)}
            />
            <Route
              path="/issues/backlog"
              component={BacklogPage}
              preload={({ params }) => backlogLoader(params.teamKey!)}
            />
            <Route
              path="/issues/board"
              component={BoardPage}
              preload={({ params }) => boardLoader(params.teamKey!)}
            />
            <Route
              path="/plans"
              component={PlansPage}
              preload={({ params }) => plansLoader(params.teamKey!)}
            />
            <Route path="/plans/create" component={CreatePlanPage} />
            <Route
              path="/plans/complete"
              component={CompletePlanPage}
              preload={({ params }) => activePlanLoader(params.teamKey!)}
            />
            <Route
              path="/plans/:planId/edit"
              component={EditPlanPage}
              preload={({ params }) => planDetailLoader(params.teamKey!, params.planId!)}
            />
            <Route
              path="/plans/:planId"
              component={PlanDetailPage}
              preload={({ params }) => planDetailLoader(params.teamKey!, params.planId!)}
            />
          </Route>
          <Route
            path="/members"
            component={MembersPage}
            preload={({ params }) => membersLoader(params.workspaceSlug!)}
          />
          <Route
            path="/members/:userId"
            component={MemberDetailPage}
            preload={({ params }) => memberDetailLoader(params.workspaceSlug!, params.userId!)}
          />
        </Route>
        <Route path="/settings" component={SettingsLayout}>
          <Route path="/" component={SettingsIndexPage} />
          <Route path="/general" component={GeneralSettingsPage} />
          <Route path="/profile" component={ProfileSettingsPage} />
          <Route
            path="/workspace"
            component={WorkspaceSettingsPage}
            preload={({ params }) => workspaceMembersLoader(params.workspaceSlug!)}
          />
          <Route
            path="/teams"
            component={TeamsSettingsPage}
            preload={() => teamsSettingsLoader()}
          />
          <Route path="/teams/create" component={CreateTeamPage} />
          <Route
            path="/teams/:teamKey"
            component={TeamDetailPage}
            preload={({ params }) => teamSettingsLoader(params.teamKey!)}
          />
        </Route>
      </Route>
    </Route>
  </Router>
);

render(() => <AppRouter />, document.getElementById("root")!);
