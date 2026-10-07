import {
  createWebsiteJsonLd,
  getRegisteredWebsite,
} from "@/lib/websiteMetadata";

import { HomeBadge } from "./HomeBadge";
import { JsonLd } from "./JsonLd";
import { MarkDiscovered } from "./MarkDiscovered";

type WebsiteFrameProps = {
  path: string;
  children: React.ReactNode;
};

/** Shared wrapper providing home navigation, discovery tracking, and JSON-LD. */
export function WebsiteFrame({ path, children }: WebsiteFrameProps) {
  const website = getRegisteredWebsite(path);

  return (
    <>
      {children}
      <HomeBadge
        corner={website.homeLink}
        mobileCorner={website.homeLinkMobile}
      />
      <MarkDiscovered path={website.path} />
      <JsonLd data={createWebsiteJsonLd(website.path)} />
    </>
  );
}
