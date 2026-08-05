import type { MetadataRoute } from "next";
import { identity } from "@/content/profile";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return [
    { url: `${identity.siteUrl}/`, lastModified, changeFrequency: "weekly", priority: 1 },
    {
      url: `${identity.siteUrl}/services`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.9,
    },
  ];
}
