import { WebsiteFrame } from "@/components/WebsiteFrame";
import { createWebsiteMetadata } from "@/lib/websiteMetadata";

export const metadata = createWebsiteMetadata("/maze-generator");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <WebsiteFrame path="/maze-generator">{children}</WebsiteFrame>;
}
