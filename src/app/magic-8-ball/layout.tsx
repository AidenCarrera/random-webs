import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Magic 8 Ball - Decision Maker",
  },
  description: "Ask a question, shake the Magic 8 Ball, and reveal a random answer. A simple browser version of the fortune-telling toy.",
  openGraph: {
    title: "Magic 8 Ball - Decision Maker",
    description: "Ask a question, shake the Magic 8 Ball, and reveal a random answer. A simple browser version of the fortune-telling toy.",
    url: "/magic-8-ball",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Magic 8 Ball - Decision Maker Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Magic 8 Ball - Decision Maker",
    description: "Ask a question, shake the Magic 8 Ball, and reveal a random answer. A simple browser version of the fortune-telling toy.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/magic-8-ball",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
