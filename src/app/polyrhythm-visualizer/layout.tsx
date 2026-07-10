import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Polyrhythm Visualizer",
  },
  description: "Visualize and hear the complex math of polyrhythms. Customize beats, instruments, tempo, and watch the satisfying mechanical rhythms collide.",
  openGraph: {
    title: "Polyrhythm Visualizer",
    description: "Visualize and hear the complex math of polyrhythms. Customize beats, instruments, tempo, and watch the satisfying mechanical rhythms collide.",
    url: "/polyrhythm-visualizer",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Polyrhythm Visualizer Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Polyrhythm Visualizer",
    description: "Visualize and hear the complex math of polyrhythms. Customize beats, instruments, tempo, and watch the satisfying mechanical rhythms collide.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/polyrhythm-visualizer",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
