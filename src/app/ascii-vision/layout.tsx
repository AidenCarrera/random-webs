import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "ASCII Vision - Image to ASCII Art",
  },
  description: "Upload any image and instantly transform it into detailed ASCII art. Adjust characters, colors, contrast, and resolution to create your own text-based artwork.",
  openGraph: {
    title: "ASCII Vision - Image to ASCII Art",
    description: "Upload any image and instantly transform it into detailed ASCII art. Adjust characters, colors, contrast, and resolution to create your own text-based artwork.",
    url: "/ascii-vision",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ASCII Vision - Image to ASCII Art Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ASCII Vision - Image to ASCII Art",
    description: "Upload any image and instantly transform it into detailed ASCII art. Adjust characters, colors, contrast, and resolution to create your own text-based artwork.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/ascii-vision",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
