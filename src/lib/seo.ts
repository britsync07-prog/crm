import type { MetadataRoute } from "next";

export const siteUrl = (
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  "https://britcrm.com"
).replace(/\/$/, "");

export const brand = {
  name: "BritCRM",
  legalName: "BritCRM by BritSync",
  description:
    "BritCRM is an AI-powered CRM for unified inbox, lead management, outreach campaigns, forms, meetings, billing, and team collaboration.",
  category: "AI CRM software",
  email: "sales@britsyncai.com",
  sameAs: [
    "https://github.com/britsync07-prog/crm",
  ],
};

export const publicSeoRoutes: Array<{
  path: string;
  title: string;
  description: string;
  priority: number;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
}> = [
  {
    path: "/landing",
    title: "BritCRM - AI CRM for Outreach, Inbox, Forms, Billing, and Teams",
    description:
      "Manage contacts, leads, campaigns, meetings, forms, invoices, and team workflows in one AI-powered CRM workspace.",
    priority: 1,
    changeFrequency: "weekly",
  },
  {
    path: "/pricing",
    title: "BritCRM Pricing - CRM Plans, Trials, Discounts, and Offers",
    description:
      "Compare BritCRM pricing plans for AI CRM, outreach automation, unified inbox, forms, meetings, billing, and team collaboration.",
    priority: 0.9,
    changeFrequency: "daily",
  },
  {
    path: "/features/ai-discovery",
    title: "AI Lead Discovery - BritCRM",
    description:
      "Use AI-powered lead discovery and CRM enrichment to find prospects, organize lead data, and build a qualified sales pipeline.",
    priority: 0.85,
    changeFrequency: "monthly",
  },
  {
    path: "/features/cognitive-writing",
    title: "AI Email Writing And Smart Inbox - BritCRM",
    description:
      "Write sales emails, follow-ups, and replies with AI while managing every customer conversation from one unified inbox.",
    priority: 0.85,
    changeFrequency: "monthly",
  },
  {
    path: "/solutions/enterprise",
    title: "Enterprise AI CRM - BritCRM",
    description:
      "Enterprise CRM controls for larger teams, secure collaboration, custom integrations, billing workflows, and operational oversight.",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    path: "/solutions/global-scale",
    title: "Global CRM Scale - BritCRM",
    description:
      "Scale outreach, inbox management, forms, meetings, and CRM operations across global teams with BritCRM.",
    priority: 0.8,
    changeFrequency: "monthly",
  },
  {
    path: "/vision/manifesto",
    title: "BritCRM Vision - AI-Native Relationship Management",
    description:
      "Read the BritCRM vision for AI-native customer relationship management, outreach, automation, and team operations.",
    priority: 0.65,
    changeFrequency: "yearly",
  },
  {
    path: "/contact",
    title: "Contact BritCRM",
    description:
      "Contact BritCRM for CRM, outreach automation, AI inbox, team collaboration, billing, and enterprise support.",
    priority: 0.7,
    changeFrequency: "monthly",
  },
  {
    path: "/signup",
    title: "Start BritCRM",
    description:
      "Create a BritCRM workspace and start managing leads, inboxes, campaigns, forms, meetings, and billing.",
    priority: 0.75,
    changeFrequency: "monthly",
  },
  {
    path: "/privacy",
    title: "BritCRM Privacy Policy",
    description: "Review BritCRM privacy practices for CRM data, account data, email integrations, and customer information.",
    priority: 0.3,
    changeFrequency: "yearly",
  },
  {
    path: "/terms",
    title: "BritCRM Terms",
    description: "Review the terms for using BritCRM CRM, outreach, billing, forms, meetings, and automation services.",
    priority: 0.3,
    changeFrequency: "yearly",
  },
];

export function absoluteUrl(path = "") {
  return `${siteUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: brand.name,
    legalName: brand.legalName,
    url: siteUrl,
    email: brand.email,
    sameAs: brand.sameAs,
  };
}

export function softwareApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: brand.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: absoluteUrl("/landing"),
    description: brand.description,
    offers: {
      "@type": "Offer",
      url: absoluteUrl("/pricing"),
      category: "SaaS",
      availability: "https://schema.org/InStock",
    },
    featureList: [
      "Unified inbox",
      "Lead management",
      "Email outreach campaigns",
      "AI email writing",
      "Forms and intake",
      "Calendar booking",
      "Billing and invoicing",
      "Team collaboration",
      "MCP server for AI agents",
    ],
  };
}
