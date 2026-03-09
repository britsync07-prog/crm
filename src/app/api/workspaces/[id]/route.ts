import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const session = await getSession();
    if (!session?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only the owner can delete the workspace
    const workspace = await prisma.workspace.findUnique({
        where: { id },
        select: { ownerId: true },
    });

    if (!workspace) {
        return NextResponse.json({ error: "Workspace not found" }, { status: 404 });
    }

    if (workspace.ownerId !== session.id) {
        return NextResponse.json(
            { error: "Only the workspace owner can delete this workspace." },
            { status: 403 }
        );
    }

    // SQLite doesn't auto-cascade unless PRAGMA foreign_keys is ON.
    // Manually delete child records in the correct dependency order.

    // 1. Messages inside channels
    const channels = await prisma.channel.findMany({
        where: { workspaceId: id },
        select: { id: true },
    });
    const channelIds = channels.map((c) => c.id);
    if (channelIds.length > 0) {
        await prisma.workspaceMessage.deleteMany({ where: { channelId: { in: channelIds } } });
    }

    // 2. WorkspaceUserRole rows (junction for custom roles)
    const roles = await prisma.workspaceRole.findMany({
        where: { workspaceId: id },
        select: { id: true },
    });
    const roleIds = roles.map((r) => r.id);
    if (roleIds.length > 0) {
        await prisma.workspaceUserRole.deleteMany({ where: { roleId: { in: roleIds } } });
    }

    // 3. Channels (M:N pivot with roles is handled by Prisma implicit table)
    await prisma.channel.deleteMany({ where: { workspaceId: id } });

    // 4. Custom roles
    await prisma.workspaceRole.deleteMany({ where: { workspaceId: id } });

    // 5. Invites
    await prisma.workspaceInvite.deleteMany({ where: { workspaceId: id } });

    // 6. Social posts
    await prisma.socialPost.deleteMany({ where: { workspaceId: id } });

    // 7. Tasks belonging to projects in this workspace (before deleting projects)
    const projects = await prisma.project.findMany({
        where: { workspaceId: id },
        select: { id: true },
    });
    const projectIds = projects.map((p) => p.id);
    if (projectIds.length > 0) {
        await prisma.task.deleteMany({ where: { projectId: { in: projectIds } } });
        await prisma.project.deleteMany({ where: { id: { in: projectIds } } });
    }

    // 8. Pipelines (stages + deals reference stages, but stages are scoped to pipelines)
    const pipelines = await prisma.pipeline.findMany({
        where: { workspaceId: id },
        select: { id: true },
    });
    const pipelineIds = pipelines.map((p) => p.id);
    if (pipelineIds.length > 0) {
        const stages = await prisma.stage.findMany({
            where: { pipelineId: { in: pipelineIds } },
            select: { id: true },
        });
        const stageIds = stages.map((s) => s.id);
        if (stageIds.length > 0) {
            // Detach deals from these stages (don't delete deals - they belong to users)
            await prisma.deal.updateMany({
                where: { stageId: { in: stageIds } },
                data: { stageId: null },
            });
            await prisma.stage.deleteMany({ where: { id: { in: stageIds } } });
        }
        await prisma.pipeline.deleteMany({ where: { id: { in: pipelineIds } } });
    }

    // 9. Employees linked to this workspace (just unlink, don't delete the User)
    await prisma.employee.updateMany({
        where: { workspaceId: id },
        data: { workspaceId: null },
    });

    // 10. WorkspaceUser memberships
    await prisma.workspaceUser.deleteMany({ where: { workspaceId: id } });

    // 11. Finally, the workspace itself
    await prisma.workspace.delete({ where: { id } });

    return NextResponse.json({ success: true });
}
