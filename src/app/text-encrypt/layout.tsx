import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Text Encrypt",
  },
  description: "Encode your private texts using various secure algorithms. Generate base64, custom ciphers, and share encrypted secret links with friends.",
  openGraph: {
    title: "Text Encrypt",
    description: "Encode your private texts using various secure algorithms. Generate base64, custom ciphers, and share encrypted secret links with friends.",
    url: "/text-encrypt",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Text Encrypt Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Text Encrypt",
    description: "Encode your private texts using various secure algorithms. Generate base64, custom ciphers, and share encrypted secret links with friends.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/text-encrypt",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
