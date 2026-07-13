import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { WEBSITES } from "../src/lib/websites.ts";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..");

function createLayoutSource(routePath: string) {
  return `import { createWebsiteMetadata } from "@/lib/websiteMetadata";

export const metadata = createWebsiteMetadata("${routePath}");

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
`;
}

function main() {
  const websites = [...WEBSITES].sort((left, right) =>
    left.path.localeCompare(right.path, "en"),
  );

  for (const website of websites) {
    const routeDirectory = website.path.replace(/^\//, "");
    const directoryPath = path.join(
      repositoryRoot,
      "src",
      "app",
      routeDirectory,
    );
    const pagePath = path.join(directoryPath, "page.tsx");

    if (!fs.existsSync(pagePath)) {
      throw new Error(
        `Cannot generate metadata layout; route page is missing: ${pagePath}`,
      );
    }

    const layoutPath = path.join(directoryPath, "layout.tsx");
    fs.writeFileSync(layoutPath, createLayoutSource(website.path), "utf8");
    console.log(`Generated ${path.relative(repositoryRoot, layoutPath)}`);
  }
}

main();
