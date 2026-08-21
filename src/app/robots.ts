import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  const disallow = [
    "/admin",
    "/api",
    "/automations",
    "/billing",
    "/calendar",
    "/calls",
    "/campaigns",
    "/customers",
    "/forms",
    "/inbox",
    "/leads",
    "/meet",
    "/onboarding",
    "/portal",
    "/settings",
    "/social",
    "/team",
  ];

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/landing",
          "/pricing",
          "/features",
          "/solutions",
          "/vision",
          "/contact",
          "/privacy",
          "/terms",
          "/signup",
          "/llms.txt",
        ],
        disallow,
      },
      {
        userAgent: ["GPTBot", "ChatGPT-User", "PerplexityBot", "ClaudeBot", "anthropic-ai", "OAI-SearchBot"],
        allow: [
          "/landing",
          "/pricing",
          "/features",
          "/solutions",
          "/vision",
          "/contact",
          "/privacy",
          "/terms",
          "/llms.txt",
        ],
        disallow,
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl(),
  };
}
