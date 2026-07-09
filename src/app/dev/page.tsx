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
  const alphabeticalWebsites = [...WEBSITES].sort((a, b) => {
    const nameA = a.title.toLowerCase();
    const nameB = b.title.toLowerCase();
    return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
  });

  return <DeveloperGate websites={alphabeticalWebsites} />;
}
