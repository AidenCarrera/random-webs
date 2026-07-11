import { MetadataRoute } from "next";
import { WEBSITES, SITE_URL } from "@/lib/websites";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = SITE_URL;

  const websiteUrls = WEBSITES.map((site) => ({
    url: `${baseUrl}${site.path}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    ...websiteUrls,
  ];
}
