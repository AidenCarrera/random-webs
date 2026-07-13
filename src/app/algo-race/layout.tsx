import { createWebsiteMetadata } from "@/lib/websiteMetadata";

export const metadata = createWebsiteMetadata("/algo-race");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
