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

  // If explicit environment user is specified, try to find it first
  if (userId || email) {
    try {
      const explicitUser = userId
        ? await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, role: true, email: true, status: true },
          })
        : await prisma.user.findUnique({
            where: { email: email || "" },
            select: { id: true, role: true, email: true, status: true },
          });

      if (explicitUser) {
        return {
          userId: explicitUser.id,
          role: explicitUser.role,
          email: explicitUser.email,
        };
      }
    } catch (err) {
      console.warn("[MCP Context] Error fetching specified user, falling back to default:", err);
    }
  }

  try {
    const user = await prisma.user.findFirst({
      orderBy: [{ role: "asc" }, { createdAt: "asc" }],
      select: { id: true, role: true, email: true },
    });
    if (user) {
      return {
        userId: user.id,
        role: user.role,
        email: user.email,
      };
    }
  } catch (err) {
    console.warn("[MCP Context] Database error during fallback context resolution:", err);
  }

  // Fallback default context if database is completely empty
  return {
    userId: "system",
    role: "ADMIN",
    email: process.env.SENDER_EMAIL || process.env.BRITCRM_MCP_USER_EMAIL || "system@local",
  };
}
