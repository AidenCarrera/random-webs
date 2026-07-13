import { createWebsiteMetadata } from "@/lib/websiteMetadata";

export const metadata = createWebsiteMetadata("/magic-8-ball");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
