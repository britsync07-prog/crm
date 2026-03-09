import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(request: NextRequest) {
    const session = await getSession();
    if (!session?.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name || !name.trim()) {
        return NextResponse.json({ error: "Workspace name is required" }, { status: 400 });
    }

    const workspace = await prisma.workspace.create({
        data: {
            name: name.trim(),
            description: description?.trim() || null,
            ownerId: session.id,
            // Auto-join the creator as an admin member
            users: {
                create: {
                    userId: session.id,
                    role: "ADMIN",
                }
            },
            // Create a default #general channel
            channels: {
                create: {
                    name: "general",
                }
            }
        }
    });

    return NextResponse.json(workspace, { status: 201 });
}
