import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Solar System",
  },
  description: "Explore orbital mechanics and gravity. Build your own solar system, adjust planet masses, speeds, orbits, and watch gravity in action.",
  openGraph: {
    title: "Solar System",
    description: "Explore orbital mechanics and gravity. Build your own solar system, adjust planet masses, speeds, orbits, and watch gravity in action.",
    url: "/solar-system",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Solar System Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Solar System",
    description: "Explore orbital mechanics and gravity. Build your own solar system, adjust planet masses, speeds, orbits, and watch gravity in action.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/solar-system",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
