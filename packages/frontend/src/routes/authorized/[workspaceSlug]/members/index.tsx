import { PageHeader } from "@/components/blocks/page-header";
import { Breadcrumbs, BreadcrumbsItem } from "@/components/custom-ui/breadcrumbs";
import { WorkspaceMemberList } from "@/components/blocks/workspace-member-list";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import UsersIcon from "lucide-solid/icons/users";
import { useWorkspaceData } from "@/context/workspace-context";
import { createAsync, useParams } from "@solidjs/router";
import { Show } from "solid-js";
import { membersLoader } from "./index.data";

export default function MembersPage() {
    const params = useParams();
    const workspaceData = useWorkspaceData();
    const members = createAsync(() => membersLoader(params.workspaceSlug!));

    return (
        <>
            <PageHeader>
                <Breadcrumbs>
                    <BreadcrumbsItem>Workspace members</BreadcrumbsItem>
                </Breadcrumbs>
            </PageHeader>

            <Show when={members() && members()!.length > 0} fallback={<MembersEmpty />}>
                <WorkspaceMemberList
                    members={members()!}
                    workspace={workspaceData().workspace}
                />
            </Show>
        </>
    );
}

function MembersEmpty() {
    return (
        <Empty>
            <EmptyHeader>
                <EmptyMedia variant="icon">
                    <UsersIcon />
                </EmptyMedia>
                <EmptyTitle>No members yet</EmptyTitle>
                <EmptyDescription>Invite teammates to collaborate on issues and plans.</EmptyDescription>
            </EmptyHeader>
        </Empty>
    );
}
