import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Submit to Void",
  },
  description: "Need to vent? Write your thoughts, secrets, or frustrations and watch them dissolve into the beautiful, dark, infinite digital void.",
  openGraph: {
    title: "Submit to Void",
    description: "Need to vent? Write your thoughts, secrets, or frustrations and watch them dissolve into the beautiful, dark, infinite digital void.",
    url: "/submit-to-void",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Submit to Void Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Submit to Void",
    description: "Need to vent? Write your thoughts, secrets, or frustrations and watch them dissolve into the beautiful, dark, infinite digital void.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/submit-to-void",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
