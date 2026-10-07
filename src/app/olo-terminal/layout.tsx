import { WebsiteFrame } from "@/components/WebsiteFrame";
import { createWebsiteMetadata } from "@/lib/websiteMetadata";

export const metadata = createWebsiteMetadata("/olo-terminal");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <WebsiteFrame path="/olo-terminal">{children}</WebsiteFrame>;
}
