import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const channelId = params instanceof Promise ? (await params).id : params.id;

        // Verify user belongs to the workspace that owns this channel
        const channel = await prisma.channel.findUnique({
            where: { id: channelId },
            include: { workspace: true }
        });

        if (!channel) return NextResponse.json({ error: "Channel not found" }, { status: 404 });

        const workspaceId = channel.workspaceId;

        const membership = await prisma.workspaceUser.findUnique({
            where: { workspaceId_userId: { workspaceId, userId: session.id } },
        });

        if (!membership && channel.workspace.ownerId !== session.id) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const messages = await prisma.workspaceMessage.findMany({
            where: { channelId },
            orderBy: { createdAt: "asc" },
            take: 100,
            include: {
                user: { select: { id: true, name: true, email: true, image: true } },
            },
        });

        return NextResponse.json({ messages });
    } catch (error: any) {
        console.error("GET /api/channels/[id]/messages error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
