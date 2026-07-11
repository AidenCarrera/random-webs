import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Typing Racer - Typing WPM Race",
  },
  description: "Race CPU opponents through neon typing passages in Rookie, Pro, or Cyber mode while tracking live WPM, accuracy, time, rank, and your high score.",
  openGraph: {
    title: "Typing Racer - Typing WPM Race",
    description: "Race CPU opponents through neon typing passages in Rookie, Pro, or Cyber mode while tracking live WPM, accuracy, time, rank, and your high score.",
    url: "/typing-racer",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Typing Racer - Typing WPM Race Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Typing Racer - Typing WPM Race",
    description: "Race CPU opponents through neon typing passages in Rookie, Pro, or Cyber mode while tracking live WPM, accuracy, time, rank, and your high score.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/typing-racer",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
