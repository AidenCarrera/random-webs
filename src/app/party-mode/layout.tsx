import { createWebsiteMetadata } from "@/lib/websiteMetadata";

export const metadata = createWebsiteMetadata("/party-mode");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
