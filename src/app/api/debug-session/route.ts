import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: "No session" });

    const accounts = await prisma.emailAccount.findMany({
        where: { userId: session.id }
    });

    const allAccounts = await prisma.emailAccount.findMany({
        select: { id: true, email: true, userId: true }
    });

    return NextResponse.json({
        sessionUserId: session.id,
        sessionEmail: session.email,
        accountsForThisUser: accounts.length,
        allAccountsInDB: allAccounts
    });
}
