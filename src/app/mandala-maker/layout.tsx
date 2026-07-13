import { createWebsiteMetadata } from "@/lib/websiteMetadata";

export const metadata = createWebsiteMetadata("/mandala-maker");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
