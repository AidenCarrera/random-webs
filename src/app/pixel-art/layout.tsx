import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Pixel Art - Simple Sprite Maker",
  },
  description: "Draw pixel art on a resizable grid with a 32-color palette, pencil, eraser, fill, and eyedropper tools, undo/redo, and PNG export.",
  openGraph: {
    title: "Pixel Art - Simple Sprite Maker",
    description: "Draw pixel art on a resizable grid with a 32-color palette, pencil, eraser, fill, and eyedropper tools, undo/redo, and PNG export.",
    url: "/pixel-art",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Pixel Art - Simple Sprite Maker Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pixel Art - Simple Sprite Maker",
    description: "Draw pixel art on a resizable grid with a 32-color palette, pencil, eraser, fill, and eyedropper tools, undo/redo, and PNG export.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/pixel-art",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
