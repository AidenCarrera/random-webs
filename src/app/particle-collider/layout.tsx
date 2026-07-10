import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Particle Collider",
  },
  description: "Simulate and visualize atomic collisions. Control velocity, particle size, charge, and collision types in an interactive physics dashboard.",
  openGraph: {
    title: "Particle Collider",
    description: "Simulate and visualize atomic collisions. Control velocity, particle size, charge, and collision types in an interactive physics dashboard.",
    url: "/particle-collider",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Particle Collider Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Particle Collider",
    description: "Simulate and visualize atomic collisions. Control velocity, particle size, charge, and collision types in an interactive physics dashboard.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/particle-collider",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
