import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Morse Code - Translate and Encode",
  },
  description: "Translate text to Morse code or tap your own messages with an interactive key. Practice, listen to the tones, and learn with a built-in Morse code cheat sheet.",
  openGraph: {
    title: "Morse Code - Translate and Encode",
    description: "Translate text to Morse code or tap your own messages with an interactive key. Practice, listen to the tones, and learn with a built-in Morse code cheat sheet.",
    url: "/morse-code",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Morse Code - Translate and Encode Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Morse Code - Translate and Encode",
    description: "Translate text to Morse code or tap your own messages with an interactive key. Practice, listen to the tones, and learn with a built-in Morse code cheat sheet.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/morse-code",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
