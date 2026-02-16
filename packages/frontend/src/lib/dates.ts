import { getLocale } from "@/paraglide/runtime";

export function formatDateShort(date: Date): string {
  return date.toLocaleDateString(getLocale(), {
    year: date.getFullYear() == new Date().getFullYear() ? undefined : "2-digit",
    month: "short",
    day: "numeric",
  });
}
