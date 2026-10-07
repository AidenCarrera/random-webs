import { WebsiteFrame } from "@/components/WebsiteFrame";
import { createWebsiteMetadata } from "@/lib/websiteMetadata";

export const metadata = createWebsiteMetadata("/polyrhythm-visualizer");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <WebsiteFrame path="/polyrhythm-visualizer">{children}</WebsiteFrame>;
}
