import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "ASCII Vision",
  },
  description: "Transform your camera feed or video into real-time ASCII text art. Adjust characters, colors, and density with this unique creative coding tool.",
  openGraph: {
    title: "ASCII Vision",
    description: "Transform your camera feed or video into real-time ASCII text art. Adjust characters, colors, and density with this unique creative coding tool.",
    url: "/ascii-vision",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ASCII Vision Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ASCII Vision",
    description: "Transform your camera feed or video into real-time ASCII text art. Adjust characters, colors, and density with this unique creative coding tool.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/ascii-vision",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
