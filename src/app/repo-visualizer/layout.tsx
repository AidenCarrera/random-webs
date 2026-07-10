import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Repo Visualizer",
  },
  description: "Generate interactive visual representations of code repository structures. Explore directories, file hierarchies, and branch histories.",
  openGraph: {
    title: "Repo Visualizer",
    description: "Generate interactive visual representations of code repository structures. Explore directories, file hierarchies, and branch histories.",
    url: "/repo-visualizer",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Repo Visualizer Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Repo Visualizer",
    description: "Generate interactive visual representations of code repository structures. Explore directories, file hierarchies, and branch histories.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/repo-visualizer",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
