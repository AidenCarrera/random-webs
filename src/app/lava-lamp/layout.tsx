import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Lava Lamp",
  },
  description: "Relax with a gorgeous, interactive virtual lava lamp. Customize fluid density, heat, color presets, and particle physics for a cozy vibe.",
  openGraph: {
    title: "Lava Lamp",
    description: "Relax with a gorgeous, interactive virtual lava lamp. Customize fluid density, heat, color presets, and particle physics for a cozy vibe.",
    url: "/lava-lamp",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Lava Lamp Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lava Lamp",
    description: "Relax with a gorgeous, interactive virtual lava lamp. Customize fluid density, heat, color presets, and particle physics for a cozy vibe.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/lava-lamp",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
