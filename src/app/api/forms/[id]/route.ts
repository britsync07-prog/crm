import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;

        // Verify ownership and delete
        const form = await prisma.form.findFirst({
            where: { id, ownerId: session.id }
        });

        if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });

        await prisma.form.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE /api/forms/[id] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
