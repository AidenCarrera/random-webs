import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Mindful Breathe",
  },
  description: "Find your calm with a guided breathing visualizer. Practice box breathing, deep breaths, and customized patterns to reduce anxiety and stress.",
  openGraph: {
    title: "Mindful Breathe",
    description: "Find your calm with a guided breathing visualizer. Practice box breathing, deep breaths, and customized patterns to reduce anxiety and stress.",
    url: "/mindful-breathe",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Mindful Breathe Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mindful Breathe",
    description: "Find your calm with a guided breathing visualizer. Practice box breathing, deep breaths, and customized patterns to reduce anxiety and stress.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/mindful-breathe",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
