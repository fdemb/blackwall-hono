import { api } from "@/lib/api";
import { debounce } from "@solid-primitives/scheduled";
import { query, createAsync } from "@solidjs/router";
import SearchIcon from "lucide-solid/icons/search";
import { createSignal, Match, Switch } from "solid-js";
import { Dynamic } from "solid-js/web";
import { UserAvatar } from "../custom-ui/avatar";
import type { PickerOption } from "../custom-ui/picker";
import { PickerDialog } from "../custom-ui/picker-dialog";
import { Button } from "../ui/button";
import { Dialog, DialogTrigger } from "../ui/dialog";

interface PickerOptionWithType extends PickerOption {
  type: "issue" | "user";
}

const globalSearchLoader = query(async (searchTerm: string, workspaceSlug: string) => {
  if (!searchTerm) {
    return { issues: [], users: [] };
  }

  const res = await api.search.$get({
    query: { q: searchTerm },
  });

  return res.json();
}, "globalSearch");

export function GlobalSearchDialog(props: { workspaceSlug: string }) {
  const [open, setOpen] = createSignal(false);
  const [searchTerm, setSearchTerm] = createSignal("");
  const setSearchTermDebounced = debounce(setSearchTerm, 300);

  const searchData = createAsync(() => globalSearchLoader(searchTerm(), props.workspaceSlug));

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setTimeout(() => {
        setSearchTerm("");
      }, 200);
    }
  };

  const options = () => {
    const data = searchData();
    if (!data) return [];

    const issueOptions =
      data.issues.map(
        (item) =>
          ({
            id: item.key,
            label: item.summary,
            linkProps: {
              href: `/${props.workspaceSlug}/issue/${item.key}`,
            },
            type: "issue",
          }) as PickerOptionWithType,
      ) || [];

    const userOptions =
      data.users.map(
        (item) =>
          ({
            id: item.id,
            label: item.name,
            icon: () => <UserAvatar user={item} size="xs" />,
            linkProps: {}, // TODO
            type: "user",
          }) as PickerOptionWithType,
      ) || [];

    return issueOptions.concat(userOptions);
  };

  return (
    <Dialog open={open()} onOpenChange={handleOpenChange}>
      <DialogTrigger as={Button} size="iconSm" variant="outline">
        <SearchIcon class="size-4" strokeWidth={2.75} />
      </DialogTrigger>

      <PickerDialog
        options={options()}
        loading={false} // createAsync doesn't expose isLoading the same way
        manualFiltering
        search={searchTerm()}
        onSearchChange={setSearchTermDebounced}
        closeOnSelect
        renderOption={(option) => (
          <div class="flex flex-row items-center gap-2">
            <Switch>
              <Match when={option.type === "issue"}>
                <span class="px-1 py-0.5 text-xs bg-muted text-muted-foreground rounded-sm border">
                  {option.id}
                </span>
                <span class="font-medium text-foreground">{option.label}</span>
              </Match>

              <Match when={option.type === "user"}>
                <Dynamic component={option.icon!} class="size-4" />
                <span>{option.label}</span>
              </Match>
            </Switch>
          </div>
        )}
      />
    </Dialog>
  );
}
