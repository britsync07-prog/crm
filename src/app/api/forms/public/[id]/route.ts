import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const form = await prisma.form.findUnique({
            where: { id },
            select: {
                id: true,
                title: true,
                description: true,
                meetingSchedulingEnabled: true,
                meetingDurationMin: true,
                fields: {
                    orderBy: { order: "asc" },
                    select: {
                        id: true,
                        label: true,
                        type: true,
                        required: true,
                        options: true,
                        order: true
                    }
                }
            }
        });

        if (!form) return NextResponse.json({ error: "Form not found" }, { status: 404 });

        // Parse options JSON
        const parsedFields = form.fields.map(f => ({
            ...f,
            options: f.options ? JSON.parse(f.options) : []
        }));

        return NextResponse.json({ ...form, fields: parsedFields });
    } catch (error) {
        console.error("GET /api/forms/public/[id] error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
