import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Magic 8 Ball",
  },
  description: "Ask a question and let the Magic 8 Ball decide. A fun, retro decision-making tool with customized answers and classic fluid motion.",
  openGraph: {
    title: "Magic 8 Ball",
    description: "Ask a question and let the Magic 8 Ball decide. A fun, retro decision-making tool with customized answers and classic fluid motion.",
    url: "/magic-8-ball",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Magic 8 Ball Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Magic 8 Ball",
    description: "Ask a question and let the Magic 8 Ball decide. A fun, retro decision-making tool with customized answers and classic fluid motion.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/magic-8-ball",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
