import { NextResponse, NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; roleId: string }> | { id: string; roleId: string } }
) {
    try {
        const session = await getSession();
        if (!session?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const resolvedParams = params instanceof Promise ? await params : params;
        const { id: workspaceId, roleId } = resolvedParams;

        // Verify Admin rights
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: {
                users: { where: { userId: session.id } }
            }
        });

        if (!workspace) return new NextResponse("Workspace not found", { status: 404 });

        const isOwner = workspace.ownerId === session.id;
        const isAdmin = isOwner || (workspace.users.length > 0 && workspace.users[0].role === "ADMIN");

        if (!isAdmin) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        // Role Edit Payload
        const body = await request.json();
        const { name, color, allowedChannelIds } = body;

        // Update Role Info & M:N relations (Channels)
        const updateData: any = {};
        if (name) updateData.name = name;
        if (color) updateData.color = color;

        // Prisma 7 M:N relation setting requires set: [{id: ...}]
        if (Array.isArray(allowedChannelIds)) {
            updateData.allowedChannels = {
                set: allowedChannelIds.map((id: string) => ({ id }))
            };
        }

        const updatedRole = await prisma.workspaceRole.update({
            where: { id: roleId },
            data: updateData,
            include: {
                allowedChannels: true
            }
        });

        return NextResponse.json(updatedRole);
    } catch (error) {
        console.error("[WORKSPACE_ROLE_PATCH]", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; roleId: string }> | { id: string; roleId: string } }
) {
    try {
        const session = await getSession();
        if (!session?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const resolvedParams = params instanceof Promise ? await params : params;
        const { id: workspaceId, roleId } = resolvedParams;

        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: {
                users: { where: { userId: session.id } }
            }
        });

        if (!workspace) return new NextResponse("Workspace not found", { status: 404 });

        const isOwner = workspace.ownerId === session.id;
        const isAdmin = isOwner || (workspace.users.length > 0 && workspace.users[0].role === "ADMIN");

        if (!isAdmin) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        await prisma.workspaceRole.delete({
            where: { id: roleId }
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("[WORKSPACE_ROLE_DELETE]", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
