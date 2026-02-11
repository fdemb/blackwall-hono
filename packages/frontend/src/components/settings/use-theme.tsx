import type { PickerOption } from "@/components/custom-ui/picker";
import { api } from "@/lib/api";
import MonitorIcon from "lucide-solid/icons/monitor";
import MoonIcon from "lucide-solid/icons/moon";
import SunIcon from "lucide-solid/icons/sun";
import { createSignal, onMount } from "solid-js";

export const themes = [
  {
    id: "system",
    label: "System",
    icon: MonitorIcon,
  },
  {
    id: "light",
    label: "Light",
    icon: SunIcon,
  },
  {
    id: "dark",
    label: "Dark",
    icon: MoonIcon,
  },
] as const satisfies PickerOption[];

type ThemeId = (typeof themes)[number]["id"];

function getCurrentThemeId(): ThemeId {
  if (typeof window === "undefined") {
    return "system";
  }

  if (document.documentElement.hasAttribute("data-theme-system")) {
    return "system";
  }
  return (document.documentElement.getAttribute("data-theme") as ThemeId) ?? "system";
}

export function applyTheme(themeId: ThemeId) {
  if (typeof window !== "undefined" && window.__applyTheme) {
    window.__applyTheme(themeId);
  }
}

export const useTheme = () => {
  const [currentThemeId, setCurrentThemeId] = createSignal<ThemeId>("system");

  onMount(() => {
    setCurrentThemeId(getCurrentThemeId());
  });

  const currentTheme = () => themes.find((t) => t.id === currentThemeId()) ?? themes[0];

  const setTheme = async (themeId: ThemeId) => {
    const theme = themes.find((t) => t.id === themeId);
    if (theme) {
      setCurrentThemeId(themeId);
      applyTheme(themeId);
      await api.api.settings["profile"]["theme"].$patch({
        json: { theme: themeId },
      });
    }
  };

  return {
    currentTheme: currentTheme as () => PickerOption<ThemeId>,
    setTheme,
    themes,
    applyTheme,
  };
};
