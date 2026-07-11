import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Solar System - Custom Planet Sandbox",
  },
  description: "Build a custom solar system with textured planets and adjustable sizes, orbits, speeds, moons, rings, and starfield themes, then export a PNG snapshot.",
  openGraph: {
    title: "Solar System - Custom Planet Sandbox",
    description: "Build a custom solar system with textured planets and adjustable sizes, orbits, speeds, moons, rings, and starfield themes, then export a PNG snapshot.",
    url: "/solar-system",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Solar System - Custom Planet Sandbox Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Solar System - Custom Planet Sandbox",
    description: "Build a custom solar system with textured planets and adjustable sizes, orbits, speeds, moons, rings, and starfield themes, then export a PNG snapshot.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/solar-system",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
