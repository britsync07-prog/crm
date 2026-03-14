import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { RoomServiceClient } from "livekit-server-sdk";

export async function POST(req: NextRequest) {
    const session = await getSession();
    if (!session?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { title, startTime, endTime } = body;

    if (!title?.trim()) {
        return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // Default to "now" if not provided, or ensure validity
    const start = startTime ? new Date(startTime) : new Date();
    const end = endTime ? new Date(endTime) : new Date(Date.now() + 3600000); // Default 1 hour

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    if (end <= start) {
        return NextResponse.json({ error: "End time must be after start time" }, { status: 400 });
    }

    // Generate a short 8-character meeting ID
    const meetingId = Math.random().toString(36).substring(2, 10);

    // Create meeting in database
    const meeting = await prisma.meeting.create({
        data: {
            title: title.trim(),
            meetingId,
            hostId: session.id,
            status: "ACTIVE",
            startTime: start,
            endTime: end,
        }
    });

    // Fire-and-forget to LiveKit server
    try {
        const livekitHost = process.env.LIVEKIT_HOST || "http://localhost:7880";
        const apiKey = process.env.LIVEKIT_API_KEY!;
        const apiSecret = process.env.LIVEKIT_API_SECRET!;
        const roomService = new RoomServiceClient(livekitHost, apiKey, apiSecret);
        
        // Use emptyTimeout to automatically close if left empty, 
        // but we'll also rely on our manual record.
        await roomService.createRoom({ 
            name: meetingId, 
            emptyTimeout: 300, 
            maxParticipants: 100,
            metadata: JSON.stringify({ endTime: end.getTime() })
        });
    } catch (e) {
        console.warn("[LiveKit] Could not pre-create room on server.", e);
    }

    const joinUrl = `/meet/${meetingId}`;

    return NextResponse.json({
        meeting_id: meetingId,
        join_url: joinUrl,
        title: meeting.title
    });
}
