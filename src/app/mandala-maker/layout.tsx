import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Mandala Maker - Symmetrical Drawing Tool",
  },
  description: "Draw beautiful radial artwork with brushes and colors, then export your finished mandalas as images.",
  openGraph: {
    title: "Mandala Maker - Symmetrical Drawing Tool",
    description: "Draw beautiful radial artwork with brushes and colors, then export your finished mandalas as images.",
    url: "/mandala-maker",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Mandala Maker - Symmetrical Drawing Tool Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mandala Maker - Symmetrical Drawing Tool",
    description: "Draw beautiful radial artwork with brushes and colors, then export your finished mandalas as images.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/mandala-maker",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
