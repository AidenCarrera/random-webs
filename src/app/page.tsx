import type { Metadata } from "next";

import { JsonLd } from "@/components/JsonLd";
import { createHomeJsonLd } from "@/lib/websiteMetadata";

import { HomeExperience } from "./_home/home-experience";
import { SiteIndex } from "./_home/site-index";

export const metadata: Metadata = {
  title: {
    absolute:
      "Random Webs - Interactive Web Experiments, Games and Simulations",
  },
};

export default function Home() {
  return (
    <>
      <HomeExperience>
        <SiteIndex />
      </HomeExperience>
      <JsonLd data={createHomeJsonLd()} />
    </>
  );
}
