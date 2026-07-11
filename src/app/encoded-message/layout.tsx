import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Encoded Message - Decrypt the Story",
  },
  description: "Hover over the encrypted transmission to decrypt the message and unveil the secret story.",
  openGraph: {
    title: "Encoded Message - Decrypt the Story",
    description: "Hover over the encrypted transmission to decrypt the message and unveil the secret story.",
    url: "/encoded-message",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Encoded Message - Decrypt the Story Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Encoded Message - Decrypt the Story",
    description: "Hover over the encrypted transmission to decrypt the message and unveil the secret story.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/encoded-message",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
