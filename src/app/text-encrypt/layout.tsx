import { createWebsiteMetadata } from "@/lib/websiteMetadata";

export const metadata = createWebsiteMetadata("/text-encrypt");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
