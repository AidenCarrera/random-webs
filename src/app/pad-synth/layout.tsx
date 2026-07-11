import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Pad Synth - Browser Synth",
  },
  description: "Play notes across major, minor, pentatonic, and blues scales with selectable waveforms, volume, reverb, and echo controls in a soft tactile interface.",
  openGraph: {
    title: "Pad Synth - Browser Synth",
    description: "Play notes across major, minor, pentatonic, and blues scales with selectable waveforms, volume, reverb, and echo controls in a soft tactile interface.",
    url: "/pad-synth",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Pad Synth - Browser Synth Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pad Synth - Browser Synth",
    description: "Play notes across major, minor, pentatonic, and blues scales with selectable waveforms, volume, reverb, and echo controls in a soft tactile interface.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/pad-synth",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
