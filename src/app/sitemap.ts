import type { MetadataRoute } from "next";
import { identity } from "@/content/profile";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: `${identity.siteUrl}/`,
      changeFrequency: "monthly",
      priority: 1,
    },
  ];
}
