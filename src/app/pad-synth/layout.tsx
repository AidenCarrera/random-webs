import { createWebsiteMetadata } from "@/lib/websiteMetadata";

export const metadata = createWebsiteMetadata("/pad-synth");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
