import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Zen Garden - Landscape Sandbox",
  },
  description: "Design a calming digital sandscape with plants and decorations, water, multiple sand themes, and image or layout export.",
  openGraph: {
    title: "Zen Garden - Landscape Sandbox",
    description: "Design a calming digital sandscape with plants and decorations, water, multiple sand themes, and image or layout export.",
    url: "/zen-garden",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Zen Garden - Landscape Sandbox Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zen Garden - Landscape Sandbox",
    description: "Design a calming digital sandscape with plants and decorations, water, multiple sand themes, and image or layout export.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/zen-garden",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
