import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Mandala Maker",
  },
  description: "Create beautiful, intricate symmetrical drawings. Customize mirror points, line thickness, brush colors, and export your digital mandala art.",
  openGraph: {
    title: "Mandala Maker",
    description: "Create beautiful, intricate symmetrical drawings. Customize mirror points, line thickness, brush colors, and export your digital mandala art.",
    url: "/mandala-maker",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Mandala Maker Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mandala Maker",
    description: "Create beautiful, intricate symmetrical drawings. Customize mirror points, line thickness, brush colors, and export your digital mandala art.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/mandala-maker",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
