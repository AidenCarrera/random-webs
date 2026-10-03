import { createWebsiteMetadata } from "@/lib/websiteMetadata";

export const metadata = createWebsiteMetadata("/blackout");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
