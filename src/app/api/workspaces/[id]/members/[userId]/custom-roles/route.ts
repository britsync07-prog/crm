import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

// Assign Custom Role to a user
export async function POST(
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
        const { roleId } = body;

        if (!roleId) {
            return NextResponse.json({ error: "roleId is required" }, { status: 400 });
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
            return NextResponse.json({ error: "Only admins can assign roles" }, { status: 403 });
        }

        const assignment = await prisma.workspaceUserRole.create({
            data: {
                userId: targetUserId,
                roleId,
            }
        });

        return NextResponse.json(assignment);
    } catch (error: any) {
        if (error.code === 'P2002') return NextResponse.json({ error: "User already has this role" }, { status: 400 });
        console.error("POST /api/workspaces/[id]/members/[userId]/custom-roles error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Remove Custom Role from a user
export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; userId: string }> | { id: string; userId: string } }
) {
    try {
        const session = await getSession();
        if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const resolvedParams = params instanceof Promise ? await params : params;
        const workspaceId = resolvedParams.id;
        const targetUserId = resolvedParams.userId;

        const searchParams = req.nextUrl.searchParams;
        const roleId = searchParams.get('roleId');

        if (!roleId) {
            return NextResponse.json({ error: "roleId parameter is required" }, { status: 400 });
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
            return NextResponse.json({ error: "Only admins can remove roles" }, { status: 403 });
        }

        // Ensure the role actually belongs to this workspace
        const role = await prisma.workspaceRole.findUnique({ where: { id: roleId } });
        if (!role || role.workspaceId !== workspaceId) {
            return NextResponse.json({ error: "Role not found in this workspace" }, { status: 404 });
        }

        await prisma.workspaceUserRole.delete({
            where: {
                userId_roleId: {
                    userId: targetUserId,
                    roleId,
                }
            }
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        if (error.code === 'P2025') return NextResponse.json({ error: "User does not have this role" }, { status: 404 });
        console.error("DELETE /api/workspaces/[id]/members/[userId]/custom-roles error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
