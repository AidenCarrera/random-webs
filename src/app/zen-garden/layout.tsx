import { createWebsiteMetadata } from "@/lib/websiteMetadata";

export const metadata = createWebsiteMetadata("/zen-garden");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
