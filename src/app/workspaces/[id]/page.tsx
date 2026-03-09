import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import WorkspaceRoom from "@/components/workspace/WorkspaceRoom";

export const dynamic = "force-dynamic";

interface Props {
    params: Promise<{ id: string }> | { id: string };
}

export default async function WorkspacePage({ params }: Props) {
    const session = await getSession();
    if (!session) redirect("/login");

    const id = params instanceof Promise ? (await params).id : params.id;

    const workspace = await prisma.workspace.findUnique({
        where: { id },
        include: {
            users: {
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            image: true,
                            customRoles: {
                                include: {
                                    role: true
                                }
                            }
                        }
                    }
                }
            },
            channels: {
                orderBy: { createdAt: "asc" },
                include: {
                    allowedRoles: true
                }
            },
            roles: {
                orderBy: { createdAt: "asc" }
            },
            projects: { include: { tasks: true } },
        }
    });

    if (!workspace) notFound();

    // Check user has access
    const isMember = (workspace as any).users.some((m: any) => m.userId === session.id);
    const isOwner = workspace.ownerId === session.id;
    if (!isMember && !isOwner) redirect("/workspaces");

    // Ensure at least one channel exists
    if ((workspace as any).channels.length === 0 && (isOwner || isMember)) {
        const defaultChannel = await prisma.channel.create({
            data: { name: "general", workspaceId: id }
        });
        (workspace as any).channels.push(defaultChannel);
    }

    const defaultChannelId = (workspace as any).channels[0]?.id || "";

    // Fetch initial messages for the first channel instead of the workspace
    const initialMessages = defaultChannelId ? await prisma.workspaceMessage.findMany({
        where: { channelId: defaultChannelId },
        orderBy: { createdAt: "asc" },
        take: 100,
        include: {
            user: { select: { id: true, name: true, email: true, image: true } }
        }
    }) : [];

    const serialized = initialMessages.map((m: any) => ({
        id: m.id,
        content: m.content,
        createdAt: m.createdAt.toISOString(),
        user: m.user,
    }));

    // Map custom roles to the members
    const memberData = (workspace as any).users.map((u: any) => ({
        userId: u.userId,
        role: u.role,
        nickname: u.nickname,
        user: u.user,
        customRoles: u.user?.customRoles?.map((ur: any) => ({
            id: ur.role.id,
            name: ur.role.name,
            color: ur.role.color
        })) || []
    }));

    return (
        <div className="h-[calc(100vh-32px)] flex flex-col px-2 sm:px-4 py-2">
            <WorkspaceRoom
                workspaceId={workspace.id}
                workspaceName={workspace.name}
                workspaceDescription={(workspace as any).description}
                channels={(workspace as any).channels.map((c: any) => ({
                    id: c.id,
                    name: c.name,
                    isPrivate: c.isPrivate,
                    allowedRoles: c.allowedRoles?.map((r: any) => ({ id: r.id, name: r.name, color: r.color })) || []
                }))}
                initialMessages={serialized}
                currentUser={{
                    id: session.id,
                    name: (session as any).name || "",
                    email: session.email,
                }}
                members={memberData}
                customRoles={(workspace as any).roles}
                isOwner={isOwner}
                isAdmin={isOwner || (workspace as any).users.some((u: any) => u.userId === session.id && u.role === "ADMIN")}
            />
        </div>
    );
}
