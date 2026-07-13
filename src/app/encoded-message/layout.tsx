import { createWebsiteMetadata } from "@/lib/websiteMetadata";

export const metadata = createWebsiteMetadata("/encoded-message");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
