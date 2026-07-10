import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Pixel Art",
  },
  description: "Draw beautiful retro pixel art on a grid canvas. Choose custom palettes, resize grids, export sprites, and animate your pixel creations.",
  openGraph: {
    title: "Pixel Art",
    description: "Draw beautiful retro pixel art on a grid canvas. Choose custom palettes, resize grids, export sprites, and animate your pixel creations.",
    url: "/pixel-art",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Pixel Art Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pixel Art",
    description: "Draw beautiful retro pixel art on a grid canvas. Choose custom palettes, resize grids, export sprites, and animate your pixel creations.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/pixel-art",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
