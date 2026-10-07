import { WebsiteFrame } from "@/components/WebsiteFrame";
import { createWebsiteMetadata } from "@/lib/websiteMetadata";

export const metadata = createWebsiteMetadata("/gravity-box");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <WebsiteFrame path="/gravity-box">{children}</WebsiteFrame>;
}
