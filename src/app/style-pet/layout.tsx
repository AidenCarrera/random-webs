import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Style Pet",
  },
  description: "Adopt and dress up a virtual digital pet! Choose from various outfits, accessories, and backgrounds to make your pet look fabulous.",
  openGraph: {
    title: "Style Pet",
    description: "Adopt and dress up a virtual digital pet! Choose from various outfits, accessories, and backgrounds to make your pet look fabulous.",
    url: "/style-pet",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Style Pet Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Style Pet",
    description: "Adopt and dress up a virtual digital pet! Choose from various outfits, accessories, and backgrounds to make your pet look fabulous.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/style-pet",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
