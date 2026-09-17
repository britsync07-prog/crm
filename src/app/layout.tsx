import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import NavigationProgressBar from "@/components/NavigationProgressBar";
import CrmAppShell from "@/components/layout/CrmAppShell";
import QueryProvider from "@/providers/QueryProvider";
import { getSession } from "@/lib/auth";
import { getUserSubscription } from "@/lib/subscription";
import { absoluteUrl, brand, organizationJsonLd, softwareApplicationJsonLd } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(absoluteUrl()),
  applicationName: brand.name,
  title: {
    default: "BritCRM by BritSync - AI CRM, Outreach, Inbox, Forms, Billing, and MCP Agents",
    template: "%s | BritCRM",
  },
  description: brand.description,
  keywords: [
    "AI CRM",
    "CRM software",
    "sales CRM",
    "email outreach",
    "unified inbox",
    "lead management",
    "billing CRM",
    "forms CRM",
    "MCP server CRM",
    "AI agents CRM",
  ],
  alternates: {
    canonical: "/landing",
  },
  openGraph: {
    type: "website",
    siteName: brand.name,
    url: "/landing",
    title: "BritCRM - AI CRM for Outreach, Inbox, Forms, Billing, and Teams",
    description: brand.description,
  },
  twitter: {
    card: "summary",
    title: "BritCRM - AI CRM for Outreach, Inbox, Forms, Billing, and Teams",
    description: brand.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();
  const subscription = session?.id ? await getUserSubscription(session.id) : null;

  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <body className="antialiased brit-theme min-h-screen">
        <NavigationProgressBar />
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd()) }}
        />
        <script
          type="application/ld+json"
          suppressHydrationWarning
          dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationJsonLd()) }}
        />
        <Toaster position="top-right" />
        <QueryProvider>
          <CrmAppShell session={session} subscription={subscription}>
            {children}
          </CrmAppShell>
        </QueryProvider>
      </body>
    </html>
  );
}
