import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Fractal Explorer",
  },
  description: "Explore the infinite beauty of fractals in real-time. Zoom into the Mandelbrot set, customize color schemes, and export gorgeous geometric patterns.",
  openGraph: {
    title: "Fractal Explorer",
    description: "Explore the infinite beauty of fractals in real-time. Zoom into the Mandelbrot set, customize color schemes, and export gorgeous geometric patterns.",
    url: "/fractal-explorer",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Fractal Explorer Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fractal Explorer",
    description: "Explore the infinite beauty of fractals in real-time. Zoom into the Mandelbrot set, customize color schemes, and export gorgeous geometric patterns.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/fractal-explorer",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
