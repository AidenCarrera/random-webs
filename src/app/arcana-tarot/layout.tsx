import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Arcana Tarot",
  },
  description: "Draw the cards and uncover your destiny. An interactive virtual tarot reading experience featuring beautiful animations, card details, and spreads.",
  openGraph: {
    title: "Arcana Tarot",
    description: "Draw the cards and uncover your destiny. An interactive virtual tarot reading experience featuring beautiful animations, card details, and spreads.",
    url: "/arcana-tarot",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Arcana Tarot Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Arcana Tarot",
    description: "Draw the cards and uncover your destiny. An interactive virtual tarot reading experience featuring beautiful animations, card details, and spreads.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/arcana-tarot",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
