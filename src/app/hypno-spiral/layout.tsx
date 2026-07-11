import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Hypno Spiral - Interactive Hypnotic Spiral",
  },
  description: "Move your mouse to shape a mesmerizing hypnotic spiral as it shifts and evolves in real time, creating endlessly unique visual patterns.",
  openGraph: {
    title: "Hypno Spiral - Interactive Hypnotic Spiral",
    description: "Move your mouse to shape a mesmerizing hypnotic spiral as it shifts and evolves in real time, creating endlessly unique visual patterns.",
    url: "/hypno-spiral",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Hypno Spiral - Interactive Hypnotic Spiral Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hypno Spiral - Interactive Hypnotic Spiral",
    description: "Move your mouse to shape a mesmerizing hypnotic spiral as it shifts and evolves in real time, creating endlessly unique visual patterns.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/hypno-spiral",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
