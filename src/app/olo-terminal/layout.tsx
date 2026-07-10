import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Olo Terminal",
  },
  description: "A vintage retro-styled command line terminal in your browser. Run commands, discover hidden easter eggs, and play retro terminal games.",
  openGraph: {
    title: "Olo Terminal",
    description: "A vintage retro-styled command line terminal in your browser. Run commands, discover hidden easter eggs, and play retro terminal games.",
    url: "/olo-terminal",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Olo Terminal Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Olo Terminal",
    description: "A vintage retro-styled command line terminal in your browser. Run commands, discover hidden easter eggs, and play retro terminal games.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/olo-terminal",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
