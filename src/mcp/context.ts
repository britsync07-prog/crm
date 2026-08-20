import { prisma } from "../lib/db.js";

export type BritCrmMcpContext = {
  userId: string;
  role: string;
  email: string;
};

export async function getMcpContext(): Promise<BritCrmMcpContext> {
  const userId = process.env.BRITCRM_MCP_USER_ID?.trim();
  const email = process.env.BRITCRM_MCP_USER_EMAIL?.trim().toLowerCase();

  if (!userId && !email) {
    throw new Error("Missing MCP user context. Set BRITCRM_MCP_USER_ID or BRITCRM_MCP_USER_EMAIL.");
  }

  const user = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, email: true, status: true },
      })
    : await prisma.user.findUnique({
        where: { email: email || "" },
        select: { id: true, role: true, email: true, status: true },
      });

  if (!user) {
    throw new Error("MCP user context does not match an existing CRM user.");
  }

  if (user.status && user.status !== "ACTIVE") {
    throw new Error("MCP user context is not active.");
  }

  return {
    userId: user.id,
    role: user.role,
    email: user.email,
  };
}

