import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
    try {
        const session = await getSession();
        if (!session?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const forms = await prisma.form.findMany({
            where: { ownerId: session.id },
            include: {
                _count: {
                    select: { submissions: true }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(forms);
    } catch (error) {
        console.error("GET /api/forms error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getSession();
        if (!session?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const payload = await req.json() as {
            title?: string;
            description?: string;
            fields?: Array<{
                label: string;
                type: string;
                required?: boolean;
                options?: string[];
            }>;
            meetingSchedulingEnabled?: boolean;
            meetingDurationMin?: number;
        };
        const { title, description, fields = [], meetingSchedulingEnabled, meetingDurationMin } = payload;

        if (!title) return NextResponse.json({ error: "Title is required" }, { status: 400 });

        const form = await prisma.form.create({
            data: {
                title,
                description,
                ownerId: session.id,
                meetingSchedulingEnabled: Boolean(meetingSchedulingEnabled),
                meetingDurationMin: Number.isFinite(Number(meetingDurationMin)) ? Math.max(30, Number(meetingDurationMin)) : 60,
                fields: {
                    create: fields.map((f, index: number) => ({
                        label: f.label,
                        type: f.type,
                        required: !!f.required,
                        options: f.options ? JSON.stringify(f.options) : null,
                        order: index
                    }))
                }
            },
            include: { fields: true }
        });

        return NextResponse.json(form);
    } catch (error) {
        console.error("POST /api/forms error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
