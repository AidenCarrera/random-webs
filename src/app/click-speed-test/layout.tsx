import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Click Speed Test",
  },
  description: "How fast can you click? Test your CPS (clicks per second) with different time limits, track your scores, and improve your clicking speed.",
  openGraph: {
    title: "Click Speed Test",
    description: "How fast can you click? Test your CPS (clicks per second) with different time limits, track your scores, and improve your clicking speed.",
    url: "/click-speed-test",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Click Speed Test Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Click Speed Test",
    description: "How fast can you click? Test your CPS (clicks per second) with different time limits, track your scores, and improve your clicking speed.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/click-speed-test",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
