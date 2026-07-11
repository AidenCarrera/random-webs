import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Olo Terminal - Web Command Line",
  },
  description: "Explore a Linux-inspired browser terminal filled with playful interactions, hidden surprises, and entertaining utilities waiting to be discovered.",
  openGraph: {
    title: "Olo Terminal - Web Command Line",
    description: "Explore a Linux-inspired browser terminal filled with playful interactions, hidden surprises, and entertaining utilities waiting to be discovered.",
    url: "/olo-terminal",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Olo Terminal - Web Command Line Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Olo Terminal - Web Command Line",
    description: "Explore a Linux-inspired browser terminal filled with playful interactions, hidden surprises, and entertaining utilities waiting to be discovered.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/olo-terminal",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
