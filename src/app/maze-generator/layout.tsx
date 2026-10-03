import { createWebsiteMetadata } from "@/lib/websiteMetadata";

export const metadata = createWebsiteMetadata("/maze-generator");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
