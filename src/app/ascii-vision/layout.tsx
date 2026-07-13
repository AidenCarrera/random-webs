import { createWebsiteMetadata } from "@/lib/websiteMetadata";

export const metadata = createWebsiteMetadata("/ascii-vision");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
