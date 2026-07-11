import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Text Encrypt - Convert Text to Secret Codes",
  },
  description: "Transform text into binary, hexadecimal, Caesar-shifted, Base64, Atbash, and ROT13 or ROT47 output with adjustable settings and one-click copying.",
  openGraph: {
    title: "Text Encrypt - Convert Text to Secret Codes",
    description: "Transform text into binary, hexadecimal, Caesar-shifted, Base64, Atbash, and ROT13 or ROT47 output with adjustable settings and one-click copying.",
    url: "/text-encrypt",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Text Encrypt - Convert Text to Secret Codes Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Text Encrypt - Convert Text to Secret Codes",
    description: "Transform text into binary, hexadecimal, Caesar-shifted, Base64, Atbash, and ROT13 or ROT47 output with adjustable settings and one-click copying.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/text-encrypt",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
