import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id: channelId } = await params;

        // Verify user belongs to the workspace that owns this channel
        const channel = await prisma.channel.findUnique({
            where: { id: channelId },
            include: {
                allowedRoles: true,
                workspace: true
            }
        });

        if (!channel) return NextResponse.json({ error: "Channel not found" }, { status: 404 });

        const workspaceId = channel.workspaceId;

        const membership = await prisma.workspaceUser.findUnique({
            where: { workspaceId_userId: { workspaceId, userId: session.id } },
        });

        const isOwner = channel.workspace.ownerId === session.id;
        if (!membership && !isOwner) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const isAdmin = isOwner || membership?.role === "ADMIN";
        if (channel.isPrivate && !isAdmin) {
            const userRoles = await prisma.workspaceUserRole.findMany({
                where: { userId: session.id, role: { workspaceId } },
                select: { roleId: true },
            });
            const userRoleIds = new Set(userRoles.map((role) => role.roleId));
            const hasAllowedRole = channel.allowedRoles.some((role) => userRoleIds.has(role.id));

            if (!hasAllowedRole) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
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
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
