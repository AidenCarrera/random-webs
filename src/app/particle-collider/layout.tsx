import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Particle Collider - Attract & Repel Particles",
  },
  description: "Shape a glowing particle field with your mouse. Switch between attraction and repulsion, then tune force strength and particle count in real time.",
  openGraph: {
    title: "Particle Collider - Attract & Repel Particles",
    description: "Shape a glowing particle field with your mouse. Switch between attraction and repulsion, then tune force strength and particle count in real time.",
    url: "/particle-collider",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Particle Collider - Attract & Repel Particles Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Particle Collider - Attract & Repel Particles",
    description: "Shape a glowing particle field with your mouse. Switch between attraction and repulsion, then tune force strength and particle count in real time.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/particle-collider",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
