import type { Metadata } from "next";
import Sidebar from "@/components/Sidebar";
import TopNavbar from "@/components/TopNavbar";
import { Toaster } from "react-hot-toast";
import { getSession } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "MiniCRM | Scale with AI",
  description: "Modern CRM with AI lead discovery and outreach automation.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <body
        className="antialiased bg-white dark:bg-[#030303] text-zinc-900 dark:text-zinc-50 min-h-screen"
      >
        <Toaster position="top-right" />
        <div className="flex min-h-screen">
          <Sidebar />
          <div className="flex-1 flex flex-col min-h-screen w-full">
            <TopNavbar session={session} />
            <main className="flex-1">
              {/* Padding handled by specific route components if needed, or globally here */}
              {children}
            </main>
          </div>
        </div>
      </body>
    </html>
  );
}
