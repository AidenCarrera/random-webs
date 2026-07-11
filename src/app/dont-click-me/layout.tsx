import type { Metadata } from "next";

export const metadata: Metadata = {
  title: {
    absolute: "Don't Click Me - Interactive Button Game",
  },
  description: "An interactive game where you are told not to click the button. Can you resist the temptation? See what happens if you click!",
  openGraph: {
    title: "Don't Click Me - Interactive Button Game",
    description: "An interactive game where you are told not to click the button. Can you resist the temptation? See what happens if you click!",
    url: "/dont-click-me",
    type: "website",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Don't Click Me - Interactive Button Game Preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Don't Click Me - Interactive Button Game",
    description: "An interactive game where you are told not to click the button. Can you resist the temptation? See what happens if you click!",
    images: ["/og-image.png"],
  },
  alternates: {
    canonical: "/dont-click-me",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
