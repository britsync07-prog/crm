import type { MetadataRoute } from "next";
import { absoluteUrl, brand } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: brand.legalName,
    short_name: brand.name,
    description: brand.description,
    start_url: "/landing",
    display: "standalone",
    background_color: "#030303",
    theme_color: "#012169",
    categories: ["business", "productivity", "crm"],
    scope: "/",
    icons: [
      {
        src: absoluteUrl("/globe.svg"),
        sizes: "any",
        type: "image/svg+xml",
      },
    ],
  };
}
