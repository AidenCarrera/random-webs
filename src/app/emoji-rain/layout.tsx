import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Emoji Rain",
  },
  description: "Create a beautiful downpour of customized emoji particles. Adjust gravity, speed, size, and emoji types in this interactive canvas toy.",
  openGraph: {
    title: "Emoji Rain",
    description: "Create a beautiful downpour of customized emoji particles. Adjust gravity, speed, size, and emoji types in this interactive canvas toy.",
    url: "/emoji-rain",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Emoji Rain Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Emoji Rain",
    description: "Create a beautiful downpour of customized emoji particles. Adjust gravity, speed, size, and emoji types in this interactive canvas toy.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/emoji-rain",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
