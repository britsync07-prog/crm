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

  // Automatic fallback: Never throw an error so the CRM connector never drops after discovery
  try {
    const adminUser = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: { id: true, role: true, email: true },
      orderBy: { createdAt: "asc" },
    });
    if (adminUser) {
      return {
        userId: adminUser.id,
        role: adminUser.role,
        email: adminUser.email,
      };
    }

    const anyUser = await prisma.user.findFirst({
      select: { id: true, role: true, email: true },
      orderBy: { createdAt: "asc" },
    });
    if (anyUser) {
      return {
        userId: anyUser.id,
        role: anyUser.role,
        email: anyUser.email,
      };
    }
  } catch (err) {
    console.warn("[MCP Context] Database error during fallback context resolution:", err);
  }

  // Safe fallback default context if database is completely empty
  return {
    userId: "default_crm_user",
    role: "ADMIN",
    email: "admin@truecrm.online",
  };
}
