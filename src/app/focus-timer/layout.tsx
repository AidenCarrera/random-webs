import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Focus Timer - Pomodoro Timer",
  },
  description: "Boost your productivity with a clean, customizable Pomodoro focus timer. Designed to help you stay on task and manage your study/work sessions.",
  openGraph: {
    title: "Focus Timer - Pomodoro Timer",
    description: "Boost your productivity with a clean, customizable Pomodoro focus timer. Designed to help you stay on task and manage your study/work sessions.",
    url: "/focus-timer",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Focus Timer - Pomodoro Timer Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Focus Timer - Pomodoro Timer",
    description: "Boost your productivity with a clean, customizable Pomodoro focus timer. Designed to help you stay on task and manage your study/work sessions.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/focus-timer",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
