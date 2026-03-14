import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { RoomServiceClient } from "livekit-server-sdk";

export async function GET() {
    try {
        const session = await getSession();
        if (!session?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const now = new Date();

        // --- LAZY CLEANUP: End expired meetings ---
        const expired = await prisma.meeting.findMany({
            where: {
                status: "ACTIVE",
                endTime: { lt: now }
            }
        });

        if (expired.length > 0) {
            // Mark as ended in DB
            await prisma.meeting.updateMany({
                where: { id: { in: expired.map(m => m.id) } },
                data: { status: "ENDED" }
            });

            // Try to delete rooms from LiveKit
            try {
                const livekitHost = process.env.LIVEKIT_HOST || "http://localhost:7880";
                const apiKey = process.env.LIVEKIT_API_KEY!;
                const apiSecret = process.env.LIVEKIT_API_SECRET!;
                const roomService = new RoomServiceClient(livekitHost, apiKey, apiSecret);
                
                for (const m of expired) {
                    await roomService.deleteRoom(m.meetingId).catch(() => {});
                }
            } catch (e) {
                console.warn("[LiveKit] Cleanup error:", e);
            }
        }

        const meetings = await prisma.meeting.findMany({
            where: { hostId: session.id },
            orderBy: { createdAt: "desc" },
            take: 30
        });

        return NextResponse.json(meetings);
    } catch (error) {
        console.error("GET /api/meetings/list error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
