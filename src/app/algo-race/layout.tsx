import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Algo Race - Sorting Algorithm Visualizer",
  },
  description: "Watch sorting algorithms compete side by side while comparing speed and overall efficiency.",
  openGraph: {
    title: "Algo Race - Sorting Algorithm Visualizer",
    description: "Watch sorting algorithms compete side by side while comparing speed and overall efficiency.",
    url: "/algo-race",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Algo Race - Sorting Algorithm Visualizer Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Algo Race - Sorting Algorithm Visualizer",
    description: "Watch sorting algorithms compete side by side while comparing speed and overall efficiency.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/algo-race",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
