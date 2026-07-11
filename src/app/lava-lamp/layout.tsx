import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Lava Lamp - Interactive Lava Simulation",
  },
  description: "Relax with a virtual lava lamp. Customize the colors of the bubbles and liquid to create your own calming combinations.",
  openGraph: {
    title: "Lava Lamp - Interactive Lava Simulation",
    description: "Relax with a virtual lava lamp. Customize the colors of the bubbles and liquid to create your own calming combinations.",
    url: "/lava-lamp",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Lava Lamp - Interactive Lava Simulation Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lava Lamp - Interactive Lava Simulation",
    description: "Relax with a virtual lava lamp. Customize the colors of the bubbles and liquid to create your own calming combinations.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/lava-lamp",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
