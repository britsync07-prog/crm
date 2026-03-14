import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const emailAccounts = await prisma.emailAccount.findMany({
      where: { userId: session.id, isActive: true },
      select: {
          id: true,
          email: true
      }
    });

    return NextResponse.json(emailAccounts);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
