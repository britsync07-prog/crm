import { AsyncLocalStorage } from "node:async_hooks";
import { prisma } from "@/lib/db";

export type BritCrmMcpContext = {
  userId: string;
  role: string;
  email: string;
};

const mcpContextStorage = new AsyncLocalStorage<BritCrmMcpContext>();

export function getCurrentMcpContext() {
  return mcpContextStorage.getStore() || null;
}

export function runWithMcpContext<T>(context: BritCrmMcpContext, operation: () => Promise<T>) {
  return mcpContextStorage.run(context, operation);
}

export async function getMcpContext(): Promise<BritCrmMcpContext> {
  const requestContext = getCurrentMcpContext();
  if (requestContext) return requestContext;

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
