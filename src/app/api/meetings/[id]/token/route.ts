import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AccessToken } from "livekit-server-sdk";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id: meetingId } = await params;
    const session = await getSession();
    const { searchParams } = new URL(request.url);
    const participantName = searchParams.get("name") || session?.name || session?.email || "Guest";

    // Validate meeting exists
    const meeting = await prisma.meeting.findUnique({
        where: { meetingId }
    });

    if (!meeting) {
        return NextResponse.json({ error: "Meeting not found" }, { status: 404 });
    }

    const now = new Date();

    // 1. Check if meeting has ended
    if (meeting.status === "CANCELED") {
        return NextResponse.json({ error: "This meeting was canceled", status: "CANCELED" }, { status: 403 });
    }

    if (meeting.status === "ENDED" || now > meeting.endTime) {
        // If it's expired but still marked active, mark it ended
        if (meeting.status === "ACTIVE") {
            await prisma.meeting.update({
                where: { id: meeting.id },
                data: { status: "ENDED" }
            });
        }
        return NextResponse.json({ error: "This meeting has ended", status: "EXPIRED" }, { status: 403 });
    }

    // 2. Check if meeting hasn't started yet (Waiting Room Logic)
    if (now < meeting.startTime) {
        return NextResponse.json({ 
            status: "WAITING", 
            startTime: meeting.startTime,
            title: meeting.title 
        });
    }

    const isHost = session?.id === meeting.hostId;

    const apiKey = process.env.LIVEKIT_API_KEY!;
    const apiSecret = process.env.LIVEKIT_API_SECRET!;

    const at = new AccessToken(apiKey, apiSecret, {
        identity: session?.id || `guest-${Math.random().toString(36).substr(2, 9)}`,
        name: participantName,
        ttl: "4h",
    });

    at.addGrant({
        roomJoin: true,
        room: meetingId,
        canPublish: true,
        canSubscribe: true,
        // Host has special permissions automatically
        roomAdmin: isHost
    });

    const token = await at.toJwt();

    return NextResponse.json({ token, isHost, title: meeting.title });
}
