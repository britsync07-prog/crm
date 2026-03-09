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
            return NextResponse.json({ error: "Only admins can generate invite links" }, { status: 403 });
        }

        // Generate a new invite valid for 7 days
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const invite = await prisma.workspaceInvite.create({
            data: {
                workspaceId,
                expiresAt,
                maxUses: null, // unlimited uses for now
            }
        });

        return NextResponse.json(invite);
    } catch (error: any) {
        console.error("POST /api/workspaces/[id]/invite error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
