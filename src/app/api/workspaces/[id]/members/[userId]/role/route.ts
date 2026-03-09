import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; userId: string }> | { id: string; userId: string } }
) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const resolvedParams = params instanceof Promise ? await params : params;
        const workspaceId = resolvedParams.id;
        const targetUserId = resolvedParams.userId;

        const body = await req.json();
        const { role } = body;

        if (role !== "ADMIN" && role !== "MEMBER") {
            return NextResponse.json({ error: "Invalid role" }, { status: 400 });
        }

        // Verify the requesting user is an owner or admin
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: { users: { where: { userId: session.id } } }
        });

        if (!workspace) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

        const isOwner = workspace.ownerId === session.id;
        const membership = workspace.users[0];
        const isAdmin = membership && membership.role === "ADMIN";

        if (!isOwner && !isAdmin) {
            return NextResponse.json({ error: "Only admins can change roles" }, { status: 403 });
        }

        // Cannot demote the workspace owner
        if (workspace.ownerId === targetUserId) {
            return NextResponse.json({ error: "Cannot change the role of the workspace owner" }, { status: 403 });
        }

        // Safely update the target user's role
        const updatedMembership = await prisma.workspaceUser.update({
            where: {
                workspaceId_userId: {
                    workspaceId,
                    userId: targetUserId
                }
            },
            data: { role }
        });

        return NextResponse.json(updatedMembership);
    } catch (error: any) {
        console.error("PATCH /api/workspaces/[id]/members/[userId]/role error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
