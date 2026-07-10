import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Pad Synth",
  },
  description: "Play and layer rich, atmospheric synthesizer pad chords. A creative web audio tool for designing ambient soundscapes and relaxation music.",
  openGraph: {
    title: "Pad Synth",
    description: "Play and layer rich, atmospheric synthesizer pad chords. A creative web audio tool for designing ambient soundscapes and relaxation music.",
    url: "/pad-synth",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Pad Synth Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pad Synth",
    description: "Play and layer rich, atmospheric synthesizer pad chords. A creative web audio tool for designing ambient soundscapes and relaxation music.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/pad-synth",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
