import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Hypno Spiral",
  },
  description: "Hypnotize yourself with stunning, customizable rotating optical illusion spirals. Adjust speed, patterns, color schemes, and styles.",
  openGraph: {
    title: "Hypno Spiral",
    description: "Hypnotize yourself with stunning, customizable rotating optical illusion spirals. Adjust speed, patterns, color schemes, and styles.",
    url: "/hypno-spiral",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Hypno Spiral Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Hypno Spiral",
    description: "Hypnotize yourself with stunning, customizable rotating optical illusion spirals. Adjust speed, patterns, color schemes, and styles.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/hypno-spiral",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
