import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Text Decrypt",
  },
  description: "Crack codes and decrypt ciphered messages. An interactive puzzle tool supporting Caesar ciphers, Vigenere, base64, and custom algorithms.",
  openGraph: {
    title: "Text Decrypt",
    description: "Crack codes and decrypt ciphered messages. An interactive puzzle tool supporting Caesar ciphers, Vigenere, base64, and custom algorithms.",
    url: "/text-decrypt",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Text Decrypt Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Text Decrypt",
    description: "Crack codes and decrypt ciphered messages. An interactive puzzle tool supporting Caesar ciphers, Vigenere, base64, and custom algorithms.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/text-decrypt",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
