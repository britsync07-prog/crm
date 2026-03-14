import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import Sidebar from "@/components/Sidebar";
import TopNavbar from "@/components/TopNavbar";
import { getSession } from "@/lib/auth";
import "./globals.css";
export const metadata: Metadata = {
 title: "BritCRM by BritSync",
 description: "BritCRM by BritSync - CRM, outreach, forms, meetings, and automation in one workspace.",
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
