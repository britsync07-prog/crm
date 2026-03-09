import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { RoomServiceClient } from "livekit-server-sdk";

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { title } = body;

    if (!title?.trim()) {
        return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Generate a short 8-character meeting ID
    const meetingId = Math.random().toString(36).substring(2, 10);

    // Create meeting in database
    const meeting = await prisma.meeting.create({
        data: {
            title: title.trim(),
            meetingId,
            hostId: session.id,
            status: "ACTIVE"
        }
    });

    // Fire-and-forget to LiveKit server (optional, but ensures room is ready)
    try {
        const livekitHost = process.env.LIVEKIT_HOST || "http://localhost:7880";
        const apiKey = process.env.LIVEKIT_API_KEY!;
        const apiSecret = process.env.LIVEKIT_API_SECRET!;
        const roomService = new RoomServiceClient(livekitHost, apiKey, apiSecret);
        await roomService.createRoom({ name: meetingId, emptyTimeout: 300, maxParticipants: 50 });
    } catch (e) {
        console.warn("[LiveKit] Could not pre-create room on server. It will be created when the first user joins.", e);
    }

    const joinUrl = `/meet/${meetingId}`;

    return NextResponse.json({
        meeting_id: meetingId,
        join_url: joinUrl,
        title: meeting.title
    });
}
