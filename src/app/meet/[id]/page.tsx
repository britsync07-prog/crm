"use client";

import "@livekit/components-styles";
import {
    LiveKitRoom,
    VideoConference,
    RoomAudioRenderer,
} from "@livekit/components-react";
import { useEffect, useState, use } from "react";
import { Loader2, Video, X } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MeetingRoomPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: meetingId } = use(params);
    const router = useRouter();

    const [token, setToken] = useState<string | null>(null);
    const [name, setName] = useState("");
    const [hasJoined, setHasJoined] = useState(false);
    const [disconnected, setDisconnected] = useState(false);
    const [waitingInfo, setWaitingInfo] = useState<{ startTime: string } | null>(null);
    const [isExpired, setIsExpired] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [title, setTitle] = useState("Meeting");
    const [disconnectReason, setDisconnectReason] = useState<string | null>(null);
    const [countdown, setCountdown] = useState<string>("");

    const getLivekitUrl = () => {
        const configuredUrl = (process.env.NEXT_PUBLIC_LIVEKIT_URL || "").trim();

        if (typeof window === "undefined") {
            return configuredUrl;
        }

        const isHttpsPage = window.location.protocol === "https:";
        if (!configuredUrl) {
            const hostname = window.location.hostname;
            if (hostname === "localhost" || hostname === "127.0.0.1") {
                return "ws://localhost:7880";
            }

            return `wss://meet.${hostname.replace(/^www\./, "")}`;
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

            if (data.status === "WAITING") {
                setWaitingInfo({ startTime: data.startTime });
                setHasJoined(false);
                return;
            }

            if (data.status === "EXPIRED") {
                setIsExpired(true);
                return;
            }

            if (data.token) {
                setToken(data.token);
                setHasJoined(true);
                setWaitingInfo(null); // Clear waiting if we got a token
            } else {
                setHasJoined(false);
            }
        } catch {
            setError("Failed to connect to the meeting server.");
        }
    };

    // Countdown logic for Waiting Room
    useEffect(() => {
        if (!waitingInfo) return;

        const timer = setInterval(() => {
            const now = new Date().getTime();
            const start = new Date(waitingInfo.startTime).getTime();
            const diff = start - now;

            if (diff <= 0) {
                clearInterval(timer);
                fetchToken(name || undefined); // Try to join now
                return;
            }

            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((diff % (1000 * 60)) / 1000);
            setCountdown(`${mins}m ${secs}s`);
        }, 1000);

        return () => clearInterval(timer);
    }, [waitingInfo, name]);

    // Auto-fetch on load (will succeed instantly if they are logged in)
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
        fetchToken();
    }, [meetingId]);

    const handleJoinClick = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) fetchToken(name.trim());
    };

    if (error || isExpired) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(1,33,105,0.12),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(200,16,46,0.12),transparent_40%),#f7f9ff] dark:bg-slate-950 p-4 text-center">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-4">
                    <X className="w-8 h-8 text-red-500" />
                </div>
                <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
                    {isExpired ? "Meeting Expired" : "Cannot Join Meeting"}
                </h2>
                <p className="text-zinc-500 text-sm mb-6 max-w-sm">
                    {isExpired ? "This meeting has already ended and the room has been closed." : error}
                </p>
                <button onClick={() => router.push("/")} className="px-5 py-2.5 bg-[#012169] text-white font-bold rounded-xl text-sm transition-colors hover:opacity-90">
                    Return Home
                </button>
            </div>
        );
    }

    if (waitingInfo) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(1,33,105,0.12),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(200,16,46,0.12),transparent_40%),#f7f9ff] dark:bg-slate-950 p-4 text-center">
                <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-3xl flex items-center justify-center mb-6 animate-pulse">
                    <Video className="w-10 h-10 text-[#012169] dark:text-blue-300" />
                </div>
                <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 mb-2 italic uppercase">Waiting Room</h1>
                <p className="text-zinc-500 text-sm mb-8 max-w-sm">
                    {title} hasn't started yet. You will be automatically moved to the meeting in:
                </p>
                
                <div className="text-5xl font-black text-[#012169] dark:text-blue-300 tabular-nums mb-8">
                    {countdown || "--:--"}
                </div>

                <div className="flex flex-col gap-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Scheduled Start</p>
                    <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                        {new Date(waitingInfo.startTime).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' })}
                    </p>
                </div>
            </div>
        );
    }

    if (!hasJoined) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(1,33,105,0.12),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(200,16,46,0.12),transparent_40%),#f7f9ff] dark:bg-slate-950 p-4">
                <div className="max-w-md w-full bg-white dark:bg-slate-950 p-8 rounded-3xl border border-blue-100 dark:border-blue-900/30 shadow-xl">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-6">
                        <Video className="w-6 h-6 text-[#012169] dark:text-blue-300" />
                    </div>
                    <h1 className="text-2xl font-black tracking-tight mb-2">Join {title}</h1>
                    <p className="text-sm text-zinc-500 mb-8">Enter your name to join the video call.</p>

                    <form onSubmit={handleJoinClick} className="space-y-4">
                        <input
                            autoFocus
                            placeholder="Your Name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-slate-900 border border-blue-100 dark:border-blue-900/30 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-[#012169] dark:text-white transition"
                        />
                        <button
                            type="submit"
                            disabled={!name.trim()}
                            className="w-full py-3 bg-[#012169] hover:bg-[#c8102e] disabled:opacity-50 text-white font-black uppercase tracking-widest text-xs rounded-xl transition-colors"
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
            <div className="flex items-center justify-center min-h-screen bg-slate-950">
                <Loader2 className="w-8 h-8 animate-spin text-[#012169]" />
            </div>
        );
    }

    if (disconnected) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(1,33,105,0.12),transparent_40%),radial-gradient(circle_at_bottom_left,rgba(200,16,46,0.12),transparent_40%),#f7f9ff] dark:bg-slate-950 p-4 text-center">
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
                    <button onClick={() => window.location.reload()} className="px-5 py-2.5 bg-zinc-200 dark:bg-slate-800 text-black dark:text-white font-bold rounded-xl text-sm transition-colors hover:opacity-90">
                        Rejoin
                    </button>
                    <button onClick={() => router.push("/")} className="px-5 py-2.5 bg-[#012169] text-white font-bold rounded-xl text-sm transition-colors hover:bg-[#c8102e]">
                        Return Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full bg-slate-950 text-white flex flex-col">
            <div className="px-6 py-4 flex items-center justify-between border-b border-white/10 shrink-0">
                <div className="flex items-center gap-3">
                    <Video className="w-5 h-5 text-[#012169]" />
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
