import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import WorkspacesList from "@/components/workspace/WorkspacesList";

export default async function WorkspacesPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const userId = session.id;

  const workspaces = await prisma.workspace.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { users: { some: { userId } } }
      ]
    },
    include: {
      users: { include: { user: true } },
      projects: { include: { tasks: true } },
      pipelines: true
    }
  });

  const serialized = workspaces.map(ws => ({
    id: ws.id,
    name: ws.name,
    ownerId: ws.ownerId,
    userCount: ws.users.length,
    projectCount: ws.projects.length,
    totalTasks: ws.projects.reduce((acc, p) => acc + p.tasks.length, 0),
    completedTasks: ws.projects.reduce((acc, p) => acc + p.tasks.filter(t => t.status === 'Done').length, 0),
  }));

  return <WorkspacesList workspaces={serialized} currentUserId={userId} />;
}
