import { createWebsiteMetadata } from "@/lib/websiteMetadata";

export const metadata = createWebsiteMetadata("/style-pet");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
