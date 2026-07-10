import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Typing Racer",
  },
  description: "Race against the clock to test your typing speed! Track your WPM (Words Per Minute), accuracy, and compare stats to level up your typing skills.",
  openGraph: {
    title: "Typing Racer",
    description: "Race against the clock to test your typing speed! Track your WPM (Words Per Minute), accuracy, and compare stats to level up your typing skills.",
    url: "/typing-racer",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Typing Racer Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Typing Racer",
    description: "Race against the clock to test your typing speed! Track your WPM (Words Per Minute), accuracy, and compare stats to level up your typing skills.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/typing-racer",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
