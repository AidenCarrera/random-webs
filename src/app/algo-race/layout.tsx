import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Algo Race",
  },
  description: "Watch bubble, quick, merge, and selection sort race to complete! An educational, interactive tool to visualize algorithm efficiency.",
  openGraph: {
    title: "Algo Race",
    description: "Watch bubble, quick, merge, and selection sort race to complete! An educational, interactive tool to visualize algorithm efficiency.",
    url: "/algo-race",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Algo Race Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Algo Race",
    description: "Watch bubble, quick, merge, and selection sort race to complete! An educational, interactive tool to visualize algorithm efficiency.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/algo-race",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
