import { createWebsiteMetadata } from "@/lib/websiteMetadata";

export const metadata = createWebsiteMetadata("/lava-lamp");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
