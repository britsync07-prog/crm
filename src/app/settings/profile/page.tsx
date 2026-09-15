import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import ProfileSettingsClient from "./ProfileSettingsClient";

export default async function ProfileSettingsPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: {
      ownedOrganization: true,
      memberProfile: {
        include: {
          organization: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/login");
  }

  const organizationName = 
    user.ownedOrganization?.name || 
    user.memberProfile?.organization?.name || 
    "Personal Workspace";

  const organizationPlan = 
    user.ownedOrganization?.plan || 
    user.memberProfile?.organization?.plan || 
    "Free";

  const userData = {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    image: user.image,
    newsletterOptedIn: user.newsletterOptedIn,
    createdAt: user.createdAt.toISOString(),
    organizationName,
    organizationPlan,
  };

  return <ProfileSettingsClient user={userData} />;
}
