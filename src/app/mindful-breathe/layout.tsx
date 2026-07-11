import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Mindful Breathe - Breathing Visualizer",
  },
  description: "Follow a calming breathing cycle with a gently pulsing orb, relaxing ambient music, and customizable timing to help you slow down and unwind.",
  openGraph: {
    title: "Mindful Breathe - Breathing Visualizer",
    description: "Follow a calming breathing cycle with a gently pulsing orb, relaxing ambient music, and customizable timing to help you slow down and unwind.",
    url: "/mindful-breathe",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Mindful Breathe - Breathing Visualizer Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mindful Breathe - Breathing Visualizer",
    description: "Follow a calming breathing cycle with a gently pulsing orb, relaxing ambient music, and customizable timing to help you slow down and unwind.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/mindful-breathe",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
