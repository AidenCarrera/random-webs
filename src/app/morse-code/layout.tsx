import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Morse Code",
  },
  description: "Translate text to Morse code and vice versa in real time. Listen to the audio telegraph tones, flash the screen, and practice typing Morse code.",
  openGraph: {
    title: "Morse Code",
    description: "Translate text to Morse code and vice versa in real time. Listen to the audio telegraph tones, flash the screen, and practice typing Morse code.",
    url: "/morse-code",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Morse Code Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Morse Code",
    description: "Translate text to Morse code and vice versa in real time. Listen to the audio telegraph tones, flash the screen, and practice typing Morse code.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/morse-code",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
