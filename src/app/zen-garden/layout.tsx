import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Zen Garden",
  },
  description: "Nurture a relaxing virtual garden. Rake sand, plant flowers, play calming ambient sounds, and escape into a peaceful, mindful space.",
  openGraph: {
    title: "Zen Garden",
    description: "Nurture a relaxing virtual garden. Rake sand, plant flowers, play calming ambient sounds, and escape into a peaceful, mindful space.",
    url: "/zen-garden",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Zen Garden Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zen Garden",
    description: "Nurture a relaxing virtual garden. Rake sand, plant flowers, play calming ambient sounds, and escape into a peaceful, mindful space.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/zen-garden",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
