import { prisma } from "@/lib/db";

export async function canAccessTask(taskId: string, userId: string): Promise<boolean> {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      assigneeId: true,
      customer: { select: { userId: true } },
      lead: { select: { userId: true } },
      project: {
        select: {
          workspace: {
            select: {
              ownerId: true,
              users: {
                where: { userId },
                select: { id: true },
              },
            },
          },
        },
      },
    },
  });

  if (!task) return false;
  if (task.assigneeId === userId) return true;
  if (task.customer?.userId === userId) return true;
  if (task.lead?.userId === userId) return true;

  const workspace = task.project?.workspace;
  if (!workspace) return false;
  return workspace.ownerId === userId || workspace.users.length > 0;
}
