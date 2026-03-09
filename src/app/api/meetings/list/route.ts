import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
    const session = await getSession();
    if (!session?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const meetings = await prisma.meeting.findMany({
        where: { hostId: session.id },
        orderBy: { createdAt: "desc" },
        take: 30
    });

    return NextResponse.json(meetings);
}
