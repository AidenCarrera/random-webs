import { createWebsiteMetadata } from "@/lib/websiteMetadata";

export const metadata = createWebsiteMetadata("/submit-to-void");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
