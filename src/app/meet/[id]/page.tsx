"use client";

import "@livekit/components-styles";
import {
    LiveKitRoom,
    VideoConference,
    RoomAudioRenderer,
} from "@livekit/components-react";
import { useEffect, useState, use } from "react";
import { RoomEvent } from "livekit-client";
import { Loader2, Video, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MeetingRoomPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: meetingId } = use(params);
    const router = useRouter();

    const [token, setToken] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [hasJoined, setHasJoined] = useState(false);
    const [disconnected, setDisconnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [title, setTitle] = useState("Meeting");
    const [disconnectReason, setDisconnectReason] = useState<string | null>(null);

    const getLivekitUrl = () => {
        const configuredUrl = (process.env.NEXT_PUBLIC_LIVEKIT_URL || "").trim();

        if (typeof window === "undefined") {
            return configuredUrl;
        }

        const isHttpsPage = window.location.protocol === "https:";
        if (!configuredUrl) {
            return isHttpsPage ? "wss://leadhunter-meeting.work.gd" : "ws://localhost:7880";
        }

        if (isHttpsPage && configuredUrl.startsWith("ws://")) {
            return configuredUrl.replace(/^ws:\/\//, "wss://");
        }

        return configuredUrl;
    };

    const fetchToken = async (participantName?: string) => {
        try {
            const res = await fetch(`/api/meetings/${meetingId}/token${participantName ? `?name=${encodeURIComponent(participantName)}` : ""}`);
            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Could not join meeting.");
                return;
            }

            setTitle(data.title || "Meeting");

            if (data.token) {
                setToken(data.token);
                setHasJoined(true);
            } else {
                // If the user isn't logged in and didn't provide a name, ask for one
                setHasJoined(false);
            }
        } catch {
            setError("Failed to connect to the meeting server.");
        }
    };

    // Auto-fetch on load (will succeed instantly if they are logged in)
    useEffect(() => {
        fetchToken();
    }, [meetingId]);

    const handleJoinClick = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) fetchToken(name.trim());
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-black p-4 text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-4">
                    <X className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">Cannot Join Meeting</h2>
                <p className="text-zinc-500 text-sm mb-6 max-w-sm">{error}</p>
                <button onClick={() => router.push("/")} className="px-5 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black font-bold rounded-xl text-sm transition-colors hover:opacity-90">
                    Return Home
                </button>
            </div>
        );
    }

    if (!hasJoined) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-black p-4">
                <div className="max-w-md w-full bg-white dark:bg-zinc-950 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl">
                    <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6">
                        <Video className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight mb-2">Join {title}</h1>
                    <p className="text-sm text-zinc-500 mb-8">Enter your name to join the video call.</p>

                    <form onSubmit={handleJoinClick} className="space-y-4">
                        <input
                            autoFocus
                            placeholder="Your Name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white transition"
                        />
                        <button
                            type="submit"
                            disabled={!name.trim()}
                            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-colors"
                        >
                            Join Meeting
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    if (!token) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-zinc-950">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
        );
    }

    if (disconnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-zinc-50 dark:bg-black p-4 text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-4">
                    <Video className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">You left the meeting</h2>
                <p className="text-zinc-500 text-sm mb-4 max-w-md">
                    If this was unexpected, your LiveKit WebSocket connection may have failed.
                </p>
                {disconnectReason && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg text-xs font-mono mb-6 max-w-md text-left overflow-auto">
                        {disconnectReason}
                    </div>
                )}
                <div className="flex gap-3">
                    <button onClick={() => window.location.reload()} className="px-5 py-2.5 bg-zinc-200 dark:bg-zinc-800 text-black dark:text-white font-bold rounded-xl text-sm transition-colors hover:opacity-90">
                        Rejoin
                    </button>
                    <button onClick={() => router.push("/")} className="px-5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl text-sm transition-colors hover:bg-indigo-700">
                        Return Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full bg-zinc-950 text-white flex flex-col">
            <div className="px-6 py-4 flex items-center justify-between border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                    <Video className="w-5 h-5 text-indigo-500" />
                    <h1 className="font-bold text-sm tracking-tight">{title} <span className="text-zinc-500 font-mono ml-2 block sm:inline">#{meetingId}</span></h1>
                </div>
            </div>

            <div className="flex-1 overflow-hidden p-2 sm:p-4">
                <div className="w-full h-full rounded-2xl overflow-hidden border border-white/10 bg-black">
                    <LiveKitRoom
                        video={true}
                        audio={true}
                        token={token}
                        serverUrl={getLivekitUrl()}
                        data-lk-theme="default"
                        style={{ height: "100%" }}
                        connectOptions={{ autoSubscribe: true }}
                        onDisconnected={() => setDisconnected(true)}
                        onError={(err) => setDisconnectReason(err?.message || "Unknown error occurred")}
                    >
                        <VideoConference />
                        <RoomAudioRenderer />
                    </LiveKitRoom>
                </div>
            </div>
        </div>
    );
}
