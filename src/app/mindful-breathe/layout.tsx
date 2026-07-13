import { createWebsiteMetadata } from "@/lib/websiteMetadata";

export const metadata = createWebsiteMetadata("/mindful-breathe");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
