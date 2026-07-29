import { ReactNode } from "react";
import SettingsTabBar from "@/components/SettingsTabBar";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function SettingsLayout({ children }: { children: ReactNode }) {
  const session = await getSession();
  if (!session) {
    redirect("/landing");
  }

  return (
    <div className="flex flex-col min-h-screen">
      <SettingsTabBar />
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}
