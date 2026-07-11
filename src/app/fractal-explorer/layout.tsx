import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Fractal Explorer - Mandelbrot Viewer",
  },
  description: "Explore the Mandelbrot set with smooth zooming, customizable colors, and an optional audio-reactive mode that brings fractals to life.",
  openGraph: {
    title: "Fractal Explorer - Mandelbrot Viewer",
    description: "Explore the Mandelbrot set with smooth zooming, customizable colors, and an optional audio-reactive mode that brings fractals to life.",
    url: "/fractal-explorer",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Fractal Explorer - Mandelbrot Viewer Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fractal Explorer - Mandelbrot Viewer",
    description: "Explore the Mandelbrot set with smooth zooming, customizable colors, and an optional audio-reactive mode that brings fractals to life.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/fractal-explorer",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
