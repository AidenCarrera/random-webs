import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Repo Visualizer - GitHub History Visualizer",
  },
  description: "Load a GitHub repository, local git log, or demo history and watch commits animate through a file-tree graph with authors, change statuses, stats, and playback controls.",
  openGraph: {
    title: "Repo Visualizer - GitHub History Visualizer",
    description: "Load a GitHub repository, local git log, or demo history and watch commits animate through a file-tree graph with authors, change statuses, stats, and playback controls.",
    url: "/repo-visualizer",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Repo Visualizer - GitHub History Visualizer Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Repo Visualizer - GitHub History Visualizer",
    description: "Load a GitHub repository, local git log, or demo history and watch commits animate through a file-tree graph with authors, change statuses, stats, and playback controls.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/repo-visualizer",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
