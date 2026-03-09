import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

// PATCH /api/workspaces/[id]/members/[userId]/nickname
export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string; userId: string }> | { id: string; userId: string } }
) {
    try {
        const session = await getSession();
        if (!session) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const resolvedParams = params instanceof Promise ? await params : params;
        const workspaceId = resolvedParams.id;
        const targetUserId = resolvedParams.userId;

        // Parse nickname from request body
        const body = await req.json();
        const { nickname } = body;

        // 1. Check if the current user is an ADMIN of the workspace
        // Also handling the fallback where ownerId is the user ID and they might not have a WorkspaceUser record
        const workspace = await prisma.workspace.findUnique({
            where: { id: workspaceId },
            include: {
                users: {
                    where: { userId: session.id }
                }
            }
        });

        if (!workspace) {
            return new NextResponse("Workspace not found", { status: 404 });
        }

        const isOwner = workspace.ownerId === session.id;
        const isMemberAdmin = workspace.users.length > 0 && workspace.users[0].role === "ADMIN";

        // Only allow Admins or the target user themselves to change their nickname
        const isSelf = session.id === targetUserId;

        if (!isOwner && !isMemberAdmin && !isSelf) {
            return new NextResponse("Forbidden: Only Workspace Admins can change other users' nicknames", { status: 403 });
        }

        // 2. Validate the target user is actually in the workspace
        const targetMember = await prisma.workspaceUser.findUnique({
            where: {
                workspaceId_userId: {
                    userId: targetUserId,
                    workspaceId,
                }
            }
        });

        if (!targetMember) {
            return new NextResponse("User is not a member of this workspace", { status: 404 });
        }

        // 3. Update the nickname
        // Pass null if it's an empty string to clear it
        const updatedUser = await prisma.workspaceUser.update({
            where: {
                workspaceId_userId: {
                    userId: targetUserId,
                    workspaceId,
                }
            },
            data: {
                nickname: nickname?.trim() || null
            } as any
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("[WORKSPACE_MEMBER_NICKNAME_PATCH]", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
