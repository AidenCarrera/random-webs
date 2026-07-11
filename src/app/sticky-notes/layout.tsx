import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Sticky Notes - Draggable Note Board",
  },
  description: "Create and arrange colorful sticky notes on a paper-like board with double-click or quick add, autosave, delete/reset controls, and Markdown export.",
  openGraph: {
    title: "Sticky Notes - Draggable Note Board",
    description: "Create and arrange colorful sticky notes on a paper-like board with double-click or quick add, autosave, delete/reset controls, and Markdown export.",
    url: "/sticky-notes",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Sticky Notes - Draggable Note Board Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Sticky Notes - Draggable Note Board",
    description: "Create and arrange colorful sticky notes on a paper-like board with double-click or quick add, autosave, delete/reset controls, and Markdown export.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/sticky-notes",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
