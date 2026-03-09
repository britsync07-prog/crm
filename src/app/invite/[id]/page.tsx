import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Users, Hash } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function InvitePage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
    const session = await getSession();
    if (!session) redirect(`/login?callbackUrl=/invite/${(params as any).id || (await params).id}`);

    const id = params instanceof Promise ? (await params).id : params.id;

    const invite = await prisma.workspaceInvite.findUnique({
        where: { id },
        include: { workspace: true }
    });

    if (!invite) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-[#0f0f10]">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Invalid Invite Link</h1>
                    <p className="text-zinc-500 mt-2 mb-6">This invite link is invalid or has expired.</p>
                    <Link href="/workspaces" className="text-indigo-600 hover:text-indigo-700 font-medium">
                        Return to Workspaces
                    </Link>
                </div>
            </div>
        );
    }

    if (invite.expiresAt && invite.expiresAt < new Date()) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-[#0f0f10]">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Invite Expired</h1>
                    <p className="text-zinc-500 mt-2 mb-6">This invite link has expired. Please ask for a new one.</p>
                    <Link href="/workspaces" className="text-indigo-600 hover:text-indigo-700 font-medium">
                        Return to Workspaces
                    </Link>
                </div>
            </div>
        );
    }

    // Check if user is already a member
    const existingMembership = await prisma.workspaceUser.findUnique({
        where: { workspaceId_userId: { workspaceId: invite.workspaceId, userId: session.id } }
    });

    if (existingMembership || invite.workspace.ownerId === session.id) {
        redirect(`/workspaces/${invite.workspaceId}`);
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-[#0f0f10] p-4">
            <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 w-full max-w-sm text-center">
                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <Hash className="w-8 h-8" />
                </div>

                <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wider mb-2">You've been invited to join</h2>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-8">{invite.workspace.name}</h1>

                <form action={async () => {
                    "use server"
                    await prisma.workspaceUser.create({
                        data: {
                            workspaceId: invite.workspaceId,
                            userId: session.id,
                            role: "MEMBER"
                        }
                    });

                    if (invite.maxUses) {
                        await prisma.workspaceInvite.update({
                            where: { id: invite.id },
                            data: { uses: { increment: 1 } }
                        });
                    }

                    redirect(`/workspaces/${invite.workspaceId}`);
                }}>
                    <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-4 rounded-xl transition-colors">
                        Accept Invite
                    </button>
                </form>

                <p className="text-xs text-zinc-400 mt-6">
                    Logged in as <span className="font-semibold text-zinc-600 dark:text-zinc-300">{session.email}</span>
                </p>
            </div>
        </div>
    );
}
