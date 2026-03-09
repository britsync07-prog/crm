import { NextResponse, NextRequest } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

// PATCH /api/workspaces/[id]/channels/[channelId]
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; channelId: string }> | { id: string; channelId: string } }
) {
    try {
        const session = await getSession();
        if (!session?.id) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const resolvedParams = params instanceof Promise ? await params : params;
        const { id: workspaceId, channelId } = resolvedParams;

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

        const body = await request.json();
        const { name, isPrivate } = body;

        const updateData: any = {};
        if (name) updateData.name = name;
        if (typeof isPrivate === "boolean") updateData.isPrivate = isPrivate;

        const updatedChannel = await prisma.channel.update({
            where: { id: channelId },
            data: updateData
        });

        return NextResponse.json(updatedChannel);
    } catch (error) {
        console.error("[CHANNEL_PATCH]", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
