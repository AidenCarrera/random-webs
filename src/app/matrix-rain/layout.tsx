import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Matrix Rain",
  },
  description: "Transform your screen into the iconic digital green rain from The Matrix. Adjust rain speed, font sizes, colors, and characters.",
  openGraph: {
    title: "Matrix Rain",
    description: "Transform your screen into the iconic digital green rain from The Matrix. Adjust rain speed, font sizes, colors, and characters.",
    url: "/matrix-rain",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Matrix Rain Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Matrix Rain",
    description: "Transform your screen into the iconic digital green rain from The Matrix. Adjust rain speed, font sizes, colors, and characters.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/matrix-rain",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
