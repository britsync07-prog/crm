import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getSession();
        if (!session?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { id } = await params;

        // Verify ownership
        const form = await prisma.form.findUnique({
            where: { id, ownerId: session.id },
            include: {
                submissions: {
                    orderBy: { createdAt: "desc" }
                },
                fields: {
                    orderBy: { order: "asc" }
                }
            }
        });

        if (!form) return NextResponse.json({ error: "Form not found or access denied" }, { status: 404 });

        // Parse submission data JSON for each entry
        const emailFieldIds = form.fields
            .filter((f) => f.label.toLowerCase().includes("email"))
            .map((f) => f.id);

        const parsedSubmissions = form.submissions.map((s) => {
            const data = JSON.parse(s.data) as Record<string, any>;
            const bookingEmail = typeof data?.__meetingBooking?.submitterEmail === "string"
                ? data.__meetingBooking.submitterEmail.trim().toLowerCase()
                : "";
            const responseEmail = emailFieldIds
                .map((fieldId) => data[fieldId])
                .find((value) => typeof value === "string" && value.trim().includes("@"));
            const submitterEmail = bookingEmail || (typeof responseEmail === "string" ? responseEmail.trim().toLowerCase() : "");

            return {
                ...s,
                data,
                _submitterEmail: submitterEmail || null,
            };
        });

        const submitterEmails = Array.from(
            new Set(parsedSubmissions.map((s) => s._submitterEmail).filter(Boolean) as string[])
        );

        const [leads, customers] = await Promise.all([
            submitterEmails.length
                ? prisma.lead.findMany({
                    where: { userId: session.id, email: { in: submitterEmails } },
                    select: { id: true, email: true, status: true },
                })
                : Promise.resolve([]),
            submitterEmails.length
                ? prisma.customer.findMany({
                    where: { userId: session.id, email: { in: submitterEmails } },
                    select: { id: true, email: true, status: true },
                })
                : Promise.resolve([]),
        ]);

        const leadByEmail = new Map(leads.map((l) => [l.email.toLowerCase(), l]));
        const customerByEmail = new Map(customers.map((c) => [c.email.toLowerCase(), c]));
        const formattedSubmissions = parsedSubmissions.map((s) => {
            const email = s._submitterEmail?.toLowerCase();
            const lead = email ? leadByEmail.get(email) : null;
            const customer = email ? customerByEmail.get(email) : null;

            return {
                ...s,
                crm: {
                    submitterEmail: s._submitterEmail,
                    leadId: lead?.id || null,
                    leadStatus: lead?.status || null,
                    customerId: customer?.id || null,
                    customerStatus: customer?.status || null,
                    meetingBooked: Boolean((s.data as Record<string, any>).__meetingBooking),
                },
            };
        });

        return NextResponse.json({
            formTitle: form.title,
            fields: form.fields,
            submissions: formattedSubmissions
        });
    } catch (error) {
        console.error("GET /api/forms/[id]/submissions error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
