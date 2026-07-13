import { createWebsiteMetadata } from "@/lib/websiteMetadata";
import "./styles.css";

export const metadata = createWebsiteMetadata("/solar-system");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
