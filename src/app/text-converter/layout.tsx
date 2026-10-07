import { WebsiteFrame } from "@/components/WebsiteFrame";
import { createWebsiteMetadata } from "@/lib/websiteMetadata";

export const metadata = createWebsiteMetadata("/text-converter");

export default function Layout({ children }: { children: React.ReactNode }) {
  return <WebsiteFrame path="/text-converter">{children}</WebsiteFrame>;
}
