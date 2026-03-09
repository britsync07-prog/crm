import { getSession } from "@/lib/auth";
import Dashboard from "@/components/Dashboard";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getSession();

  if (!session) {
    redirect("/landing");
  }

  return <Dashboard />;
}
