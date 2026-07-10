import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Beat Maker",
  },
  description: "Create, customize, and loop your own beats in your browser. An intuitive web-based audio sequencer and drum pad for aspiring beatmakers.",
  openGraph: {
    title: "Beat Maker",
    description: "Create, customize, and loop your own beats in your browser. An intuitive web-based audio sequencer and drum pad for aspiring beatmakers.",
    url: "/beat-maker",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Beat Maker Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Beat Maker",
    description: "Create, customize, and loop your own beats in your browser. An intuitive web-based audio sequencer and drum pad for aspiring beatmakers.",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/beat-maker",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
