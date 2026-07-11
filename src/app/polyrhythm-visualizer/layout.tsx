import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Polyrhythm Visualizer - Layered Rhythms",
  },
  description: "Hear layered rhythms at adjustable tempo while switching between circle, timeline, bloom, and 3D visualizations with playback controls.",
  openGraph: {
    title: "Polyrhythm Visualizer - Layered Rhythms",
    description: "Hear layered rhythms at adjustable tempo while switching between circle, timeline, bloom, and 3D visualizations with playback controls.",
    url: "/polyrhythm-visualizer",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Polyrhythm Visualizer - Layered Rhythms Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Polyrhythm Visualizer - Layered Rhythms",
    description: "Hear layered rhythms at adjustable tempo while switching between circle, timeline, bloom, and 3D visualizations with playback controls.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/polyrhythm-visualizer",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
