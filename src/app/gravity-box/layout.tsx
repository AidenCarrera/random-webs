import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Gravity Box - Physics Sandbox",
  },
  description: "Experiment with gravity, collisions, and object physics in a playful sandbox where every setting changes the simulation.",
  openGraph: {
    title: "Gravity Box - Physics Sandbox",
    description: "Experiment with gravity, collisions, and object physics in a playful sandbox where every setting changes the simulation.",
    url: "/gravity-box",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Gravity Box - Physics Sandbox Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gravity Box - Physics Sandbox",
    description: "Experiment with gravity, collisions, and object physics in a playful sandbox where every setting changes the simulation.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/gravity-box",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
