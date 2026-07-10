import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Party Mode",
  },
  description: "Turn your browser into a dynamic club party. Features flashing neon lights, color loops, interactive beats, and audio visualizer aesthetics.",
  openGraph: {
    title: "Party Mode",
    description: "Turn your browser into a dynamic club party. Features flashing neon lights, color loops, interactive beats, and audio visualizer aesthetics.",
    url: "/party-mode",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Party Mode Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Party Mode",
    description: "Turn your browser into a dynamic club party. Features flashing neon lights, color loops, interactive beats, and audio visualizer aesthetics.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/party-mode",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
