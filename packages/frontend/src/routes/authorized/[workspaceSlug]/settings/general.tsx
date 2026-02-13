import { PickerPopover } from "@/components/custom-ui/picker-popover";
import {
  SettingsCard,
  SettingsPage,
  SettingsRow,
  SettingsSection,
} from "@/components/settings/settings-sections";
import { useLocale } from "@/components/settings/use-locale";
import { useTheme } from "@/components/settings/use-theme";
import { Button } from "@/components/ui/button";
import { useSessionData } from "@/context/session-context";
import { Popover } from "@kobalte/core/popover";
import ChevronDownIcon from "lucide-solid/icons/chevron-down";
import { Show } from "solid-js";
import { Dynamic } from "solid-js/web";

export default function GeneralSettingsPage() {
  const session = useSessionData();

  return (
    <SettingsPage title="General settings">
      <SettingsSection title="UI settings">
        <SettingsCard>
          <SettingsRow title="Theme" description="Customize the appearance of the app.">
            <ThemeSelector />
          </SettingsRow>
          <SettingsRow
            title="Language"
            description="Select a preferred language, or use your system default."
          >
            <LocaleSelector
              preferredLocale={(session().user as { preferredLocale?: string | null }).preferredLocale}
            />
          </SettingsRow>
        </SettingsCard>
      </SettingsSection>
    </SettingsPage>
  );
}

function ThemeSelector() {
  const { currentTheme, setTheme, themes } = useTheme();

  return (
    <Popover>
      <Popover.Trigger as={Button} variant="outline">
        <Show when={currentTheme().icon}>
          <Dynamic component={currentTheme().icon} class="size-4 shrink-0" />
        </Show>
        {currentTheme().label}
        <ChevronDownIcon class="size-4" />
      </Popover.Trigger>

      <PickerPopover options={themes} value={currentTheme().id} onChange={setTheme} />
    </Popover>
  );
}

function LocaleSelector(props: { preferredLocale?: string | null }) {
  const { currentLocale, setLocalePreference, locales } = useLocale({
    preferredLocale: props.preferredLocale,
  });

  return (
    <Popover>
      <Popover.Trigger as={Button} variant="outline">
        {currentLocale().label}
        <ChevronDownIcon class="size-4" />
      </Popover.Trigger>

      <PickerPopover options={locales} value={currentLocale().id} onChange={setLocalePreference} />
    </Popover>
  );
}
