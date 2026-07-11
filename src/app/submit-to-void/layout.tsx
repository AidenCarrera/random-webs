import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Submit to Void - Black Hole Message Shredder",
  },
  description: "Type a short message and watch every character shred into a black hole, surrounded by stars, and optional GIF export.",
  openGraph: {
    title: "Submit to Void - Black Hole Message Shredder",
    description: "Type a short message and watch every character shred into a black hole, surrounded by stars, and optional GIF export.",
    url: "/submit-to-void",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Submit to Void - Black Hole Message Shredder Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Submit to Void - Black Hole Message Shredder",
    description: "Type a short message and watch every character shred into a black hole, surrounded by stars, and optional GIF export.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/submit-to-void",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
