import { createWebsiteMetadata } from "@/lib/websiteMetadata";

export const metadata = createWebsiteMetadata("/click-speed-test");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
