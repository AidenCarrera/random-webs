import type { Metadata } from "next";
import { WEBSITES } from "@/lib/websites";
import { DeveloperGate } from "./DeveloperGate";

export const metadata: Metadata = {
  title: "Developer Websites Index",
  robots: {
    index: false,
    follow: false,
  },
};

export default function DeveloperWebsitesPage() {
  const alphabeticalWebsites = [...WEBSITES].sort((a, b) =>
    a.title.localeCompare(b.title),
  );

  return <DeveloperGate websites={alphabeticalWebsites} />;
}
