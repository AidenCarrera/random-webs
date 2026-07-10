import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Gravity Box",
  },
  description: "Play with gravity, collision physics, and customizable objects in this interactive 2D physics sandbox. Adjust mass, friction, and bounce.",
  openGraph: {
    title: "Gravity Box",
    description: "Play with gravity, collision physics, and customizable objects in this interactive 2D physics sandbox. Adjust mass, friction, and bounce.",
    url: "/gravity-box",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Gravity Box Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Gravity Box",
    description: "Play with gravity, collision physics, and customizable objects in this interactive 2D physics sandbox. Adjust mass, friction, and bounce.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/gravity-box",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
