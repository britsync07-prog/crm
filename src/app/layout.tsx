import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import Sidebar from "@/components/Sidebar";
import TopNavbar from "@/components/TopNavbar";
import { getSession } from "@/lib/auth";
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

  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <body className="antialiased brit-theme min-h-screen">
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
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col min-h-screen w-full">
            <TopNavbar session={session} />
            <main className="flex-1">
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
