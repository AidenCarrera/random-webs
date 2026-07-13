import { createWebsiteMetadata } from "@/lib/websiteMetadata";

export const metadata = createWebsiteMetadata("/boids-simulator");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
