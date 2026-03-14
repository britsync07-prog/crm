import { getSession } from "@/lib/auth";
import OutreachSenderConsole from "@/components/OutreachSenderConsole";

export default async function CampaignsPage() {
  const session = await getSession();
  if (!session) return null;

  return <OutreachSenderConsole />;
}
