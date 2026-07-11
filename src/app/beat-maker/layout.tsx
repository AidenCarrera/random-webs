import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Beat Maker - Browser Beat Sequencer",
  },
  description: "Build beats with an intuitive step sequencer, swappable drum sounds, an 808 bass editor, and mixer controls. No download required.",
  openGraph: {
    title: "Beat Maker - Browser Beat Sequencer",
    description: "Build beats with an intuitive step sequencer, swappable drum sounds, an 808 bass editor, and mixer controls. No download required.",
    url: "/beat-maker",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Beat Maker - Browser Beat Sequencer Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Beat Maker - Browser Beat Sequencer",
    description: "Build beats with an intuitive step sequencer, swappable drum sounds, an 808 bass editor, and mixer controls. No download required.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/beat-maker",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
