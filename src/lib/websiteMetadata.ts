import type { Metadata } from "next";

import { SITE_URL } from "./site-url.ts";
import { WEBSITES, type WebsiteCategoryId } from "./websites.ts";

const SITE_NAME = "Random Webs";

const WEBSITE_BY_PATH = new Map(
  WEBSITES.map((website) => [website.path, website]),
);

const APPLICATION_CATEGORY: Record<WebsiteCategoryId, string> = {
  games: "GameApplication",
  simulations: "EntertainmentApplication",
  audio: "MultimediaApplication",
  visual: "EntertainmentApplication",
  utilities: "UtilitiesApplication",
};

export function getRegisteredWebsite(routePath: string) {
  const website = WEBSITE_BY_PATH.get(routePath);

  if (!website) {
    throw new Error(`Website metadata is not registered for '${routePath}'.`);
  }

  return website;
}

export function createWebsiteMetadata(routePath: string): Metadata {
  const website = getRegisteredWebsite(routePath);
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

export function createWebsiteJsonLd(routePath: string) {
  const website = getRegisteredWebsite(routePath);
  const url = `${SITE_URL}${website.path}`;

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        "@id": `${url}#app`,
        name: website.title,
        description: website.metadata.description,
        url,
        applicationCategory: APPLICATION_CATEGORY[website.category],
        operatingSystem: "Any",
        browserRequirements: "Requires JavaScript",
        isAccessibleForFree: true,
        offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
        dateModified: website.lastModified,
        isPartOf: {
          "@type": "WebSite",
          "@id": `${SITE_URL}/#website`,
          name: SITE_NAME,
          url: SITE_URL,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE_NAME, item: SITE_URL },
          { "@type": "ListItem", position: 2, name: website.title, item: url },
        ],
      },
    ],
  };
}

// Mirrors the home page site index.
export function createHomeJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        name: SITE_NAME,
        url: SITE_URL,
      },
      {
        "@type": "ItemList",
        name: `${SITE_NAME} websites`,
        numberOfItems: WEBSITES.length,
        itemListElement: WEBSITES.map((website, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: website.title,
          url: `${SITE_URL}${website.path}`,
        })),
      },
    ],
  };
}
