import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Sticky Notes",
  },
  description: "Organize your ideas, reminders, and tasks on a virtual corkboard. Drag, color-code, resize, and store notes directly in your browser.",
  openGraph: {
    title: "Sticky Notes",
    description: "Organize your ideas, reminders, and tasks on a virtual corkboard. Drag, color-code, resize, and store notes directly in your browser.",
    url: "/sticky-notes",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Sticky Notes Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sticky Notes",
    description: "Organize your ideas, reminders, and tasks on a virtual corkboard. Drag, color-code, resize, and store notes directly in your browser.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/sticky-notes",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
