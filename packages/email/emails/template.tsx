import type { ReactNode } from "react";
import {
  Body,
  Container,
  Head,
  Html,
  Link,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";

const tailwindConfig = {
  theme: {
    extend: {
      colors: {
        background: "#f8f5fc",
        foreground: "#2d2a3e",
        card: "#faf8fd",
        "card-foreground": "#2d2a3e",
        primary: "#e85c5c",
        "primary-foreground": "#ffffff",
        secondary: "#ede8f4",
        "secondary-foreground": "#2d2a3e",
        muted: "#e4dff0",
        surface: "#f0ebf7",
        "muted-foreground": "#68627d",
        accent: "#ede8f4",
        "accent-foreground": "#2d2a3e",
        destructive: "#e85c5c",
        "destructive-foreground": "#ffffff",
        border: "#e0dbe8",
        input: "#f8f5fc",
        ring: "#d98a5c",
        placeholder: "#9892ad",
        "theme-red": "#e56767",
        "theme-orange": "#d98a5c",
        "theme-yellow": "#d9a54d",
        "theme-green": "#4db08a",
        "theme-teal": "#3a9aa3",
        "theme-blue": "#4a8ae6",
        "theme-violet": "#6b75d4",
        "theme-purple": "#9a6aa8",
        "theme-pink": "#d47a9e",
      },
    },
  },
};

interface EmailTemplateProps {
  preview: string;
  children: ReactNode;
}

export function EmailTemplate({ preview, children }: EmailTemplateProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Tailwind config={tailwindConfig}>
        <Body className="bg-background font-sans">
          <Container className="mx-auto max-w-xl py-8">
            <Section className="rounded-lg bg-card px-8 py-6 shadow-sm">{children}</Section>
            <Text className="mt-6 text-center text-xs text-muted-foreground">
              Sent by{" "}
              <Link href="https://blackwall.dev" className="text-foreground underline">
                Blackwall
              </Link>
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}
