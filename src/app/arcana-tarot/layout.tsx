import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Arcana Tarot - Virtual Tarot Readings",
  },
  description: "Shuffle the deck, draw tarot cards, and explore detailed meanings with a modern interactive tarot experience.",
  openGraph: {
    title: "Arcana Tarot - Virtual Tarot Readings",
    description: "Shuffle the deck, draw tarot cards, and explore detailed meanings with a modern interactive tarot experience.",
    url: "/arcana-tarot",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Arcana Tarot - Virtual Tarot Readings Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Arcana Tarot - Virtual Tarot Readings",
    description: "Shuffle the deck, draw tarot cards, and explore detailed meanings with a modern interactive tarot experience.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/arcana-tarot",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
