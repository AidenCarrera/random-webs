import { createWebsiteMetadata } from "@/lib/websiteMetadata";

export const metadata = createWebsiteMetadata("/gravity-box");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
