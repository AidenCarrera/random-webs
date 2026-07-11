import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Style Pet - Virtual Pet Simulator",
  },
  description: "Care for a handheld-style virtual pet by feeding, petting, cleaning, and managing sleep, then customize its skin, hats, and accessories as it grows.",
  openGraph: {
    title: "Style Pet - Virtual Pet Simulator",
    description: "Care for a handheld-style virtual pet by feeding, petting, cleaning, and managing sleep, then customize its skin, hats, and accessories as it grows.",
    url: "/style-pet",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Style Pet - Virtual Pet Simulator Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Style Pet - Virtual Pet Simulator",
    description: "Care for a handheld-style virtual pet by feeding, petting, cleaning, and managing sleep, then customize its skin, hats, and accessories as it grows.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/style-pet",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
