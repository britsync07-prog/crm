import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const workspaceId = params instanceof Promise ? (await params).id : params.id;
        const body = await req.json();
        const { name } = body;

        if (!name || name.trim().length === 0) {
            return NextResponse.json({ error: "Channel name is required" }, { status: 400 });
        }

        // Verify user is an admin or owner of this workspace
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: { users: { where: { userId: session.id } } }
        });

        if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

        const isOwner = workspace.ownerId === session.id;
        const membership = workspace.users[0];
        const isAdmin = membership && membership.role === "ADMIN";

        if (!isOwner && !isAdmin) {
            return NextResponse.json({ error: "Only admins can create channels" }, { status: 403 });
        }

        const channelName = name.trim().toLowerCase().replace(/\s+/g, '-');

        const channel = await prisma.channel.create({
            data: {
                name: channelName,
                workspaceId,
            }
        });

        return NextResponse.json(channel);
    } catch (error: any) {
        console.error("POST /api/workspaces/[id]/channels error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
