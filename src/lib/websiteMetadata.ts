import type { Metadata } from "next";

import { WEBSITES } from "./websites.ts";

const WEBSITE_BY_PATH = new Map(
  WEBSITES.map((website) => [website.path, website]),
);

export function createWebsiteMetadata(routePath: string): Metadata {
  const website = WEBSITE_BY_PATH.get(routePath);

  if (!website) {
    throw new Error(`Website metadata is not registered for '${routePath}'.`);
  }

  const { title, description } = website.metadata;

  return {
    title: {
      absolute: title,
    },
    description,
    openGraph: {
      title,
      description,
      url: website.path,
      type: "website",
      images: [
        {
          url: "/og-image.png",
          width: 1200,
          height: 630,
          alt: `${title} Preview`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/og-image.png"],
    },
    alternates: {
      canonical: website.path,
    },
  };
}
