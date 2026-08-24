"use client";

import "@livekit/components-styles";
import {
    LiveKitRoom,
    VideoConference,
    RoomAudioRenderer,
} from "@livekit/components-react";
import { BackgroundProcessor, type BackgroundProcessorWrapper, type SwitchBackgroundProcessorOptions, supportsBackgroundProcessors } from "@livekit/track-processors";
import { createLocalAudioTrack, createLocalVideoTrack, LocalAudioTrack, LocalVideoTrack, Room, Track, VideoPresets } from "livekit-client";
import { useCallback, useEffect, useMemo, useRef, useState, use } from "react";
import { ImageIcon, Loader2, Sparkles, Video, VideoOff, X } from "lucide-react";
import { useRouter } from "next/navigation";

type BackgroundMode = "none" | "blur" | "virtual";

const backgroundModes: Array<{ mode: BackgroundMode; label: string }> = [
    { mode: "none", label: "None" },
    { mode: "blur", label: "Blur" },
    { mode: "virtual", label: "Virtual" },
];

const virtualBackgroundPath = "/backgrounds/britcrm-office.png";
const mediaPipeAssetPaths = {
    tasksVisionFileSet: "/mediapipe/wasm",
    modelAssetPath: "/mediapipe/selfie_segmenter.tflite",
};

function getBackgroundSwitchOptions(mode: BackgroundMode): SwitchBackgroundProcessorOptions {
    if (mode === "blur") return { mode: "background-blur", blurRadius: 10 };
    if (mode === "virtual") return { mode: "virtual-background", imagePath: virtualBackgroundPath };
    return { mode: "disabled" };
}

function getBackgroundErrorMessage(error: unknown) {
    if (error instanceof Error && error.message) return error.message;
    if (typeof error === "string" && error.trim()) return error;
    try {
        return JSON.stringify(error);
    } catch {
        return "The browser could not initialize the segmentation processor.";
    }
}

function BackgroundModeSelector({
    value,
    supported,
    onChange,
}: {
    value: BackgroundMode;
    supported: boolean;
    onChange: (mode: BackgroundMode) => void;
}) {
    return (
        <div className="flex overflow-hidden rounded-xl border border-white/10 bg-black/70 p-1 shadow-2xl backdrop-blur">
            {backgroundModes.map((item) => {
                const isActive = value === item.mode;
                return (
                    <button
                        key={item.mode}
                        type="button"
                        onClick={() => onChange(item.mode)}
                        disabled={!supported && item.mode !== "none"}
                        className={`flex min-h-9 items-center gap-2 rounded-lg px-3 text-xs font-black transition ${
                            isActive
                                ? "bg-white text-slate-950"
                                : "text-white/75 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                        }`}
                    >
                        {item.mode === "virtual" ? <ImageIcon className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
                        {item.label}
                    </button>
                );
            })}
        </div>
    );
}

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
    const [backgroundMode, setBackgroundMode] = useState<BackgroundMode>("none");
    const [backgroundSupported, setBackgroundSupported] = useState(false);
    const [backgroundChecked, setBackgroundChecked] = useState(false);
    const [backgroundError, setBackgroundError] = useState<string | null>(null);
    const [previewError, setPreviewError] = useState<string | null>(null);
    const [previewReady, setPreviewReady] = useState(false);
    const [previewStarting, setPreviewStarting] = useState(false);
    const [tracksPublished, setTracksPublished] = useState(false);

    const previewVideoRef = useRef<HTMLVideoElement | null>(null);
    const localVideoTrackRef = useRef<LocalVideoTrack | null>(null);
    const localAudioTrackRef = useRef<LocalAudioTrack | null>(null);
    const backgroundProcessorRef = useRef<BackgroundProcessorWrapper | null>(null);
    const publishingRef = useRef(false);
    const room = useMemo(() => new Room(), []);

    const attachBackgroundProcessor = useCallback(async (videoTrack: LocalVideoTrack, mode: BackgroundMode) => {
        const processor = BackgroundProcessor({
            ...getBackgroundSwitchOptions("none"),
            assetPaths: mediaPipeAssetPaths,
        });

        await videoTrack.setProcessor(processor);
        await processor.switchTo(getBackgroundSwitchOptions(mode));
        backgroundProcessorRef.current = processor;
        setBackgroundError(null);
    }, []);

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

    const fetchMeetingStatus = useCallback(async () => {
        try {
            const res = await fetch(`/api/meetings/${meetingId}/token?preview=1`);
            const data = await res.json();

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

            if (!res.ok) {
                setError(data.error || "Could not load meeting.");
                return;
            }

            setWaitingInfo(null);
            setHasJoined(false);
        } catch {
            setError("Failed to connect to the meeting server.");
        }
    }, [meetingId]);

    const fetchToken = useCallback(async (participantName: string, selectedBackgroundMode: BackgroundMode) => {
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
                setBackgroundMode(backgroundSupported ? selectedBackgroundMode : "none");
                setToken(data.token);
                setHasJoined(true);
                setWaitingInfo(null); // Clear waiting if we got a token
                setTracksPublished(false);
            } else {
                setHasJoined(false);
            }
        } catch {
            setError("Failed to connect to the meeting server.");
        }
    }, [backgroundSupported, meetingId]);

    // Countdown logic for Waiting Room
    useEffect(() => {
        if (!waitingInfo) return;

        const timer = setInterval(() => {
            const now = new Date().getTime();
            const start = new Date(waitingInfo.startTime).getTime();
            const diff = start - now;

            if (diff <= 0) {
                clearInterval(timer);
                fetchMeetingStatus();
                return;
            }

            const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const secs = Math.floor((diff % (1000 * 60)) / 1000);
            setCountdown(`${mins}m ${secs}s`);
        }, 1000);

        return () => clearInterval(timer);
    }, [fetchMeetingStatus, waitingInfo]);

    useEffect(() => {
        fetchMeetingStatus();
    }, [fetchMeetingStatus]);

    useEffect(() => {
        setBackgroundSupported(supportsBackgroundProcessors());
        setBackgroundChecked(true);
    }, []);

    useEffect(() => {
        if (backgroundChecked && !backgroundSupported && backgroundMode !== "none") {
            setBackgroundMode("none");
        }
    }, [backgroundChecked, backgroundMode, backgroundSupported]);

    useEffect(() => {
        return () => {
            room.disconnect();
            localVideoTrackRef.current?.stop();
            localAudioTrackRef.current?.stop();
            void backgroundProcessorRef.current?.destroy();
        };
    }, [room]);

    const startCameraPreview = useCallback(async () => {
        if (previewStarting || previewReady || hasJoined || waitingInfo || error || isExpired) return;

        try {
            setPreviewStarting(true);
            setPreviewError(null);

            const videoTrack = await createLocalVideoTrack({
                facingMode: "user",
                resolution: VideoPresets.h360.resolution,
            });

            localVideoTrackRef.current = videoTrack;

            if (backgroundSupported) {
                await attachBackgroundProcessor(videoTrack, backgroundMode);
            }

            setPreviewReady(true);
        } catch (error) {
            localVideoTrackRef.current?.stop();
            localVideoTrackRef.current = null;
            setPreviewReady(false);
            setPreviewError(error instanceof Error ? error.message : "Could not start camera preview.");
        } finally {
            setPreviewStarting(false);
        }
    }, [attachBackgroundProcessor, backgroundMode, backgroundSupported, error, hasJoined, isExpired, previewReady, previewStarting, waitingInfo]);

    useEffect(() => {
        const videoElement = previewVideoRef.current;
        const videoTrack = localVideoTrackRef.current;

        if (!videoElement || !videoTrack || hasJoined) return;

        videoTrack.attach(videoElement);
        videoElement.muted = true;
        videoElement.playsInline = true;

        return () => {
            videoTrack.detach(videoElement);
        };
    }, [hasJoined, previewReady]);

    const handleBackgroundModeChange = (mode: BackgroundMode) => {
        setBackgroundMode(mode);
        if (mode === "none") {
            setBackgroundError(null);
            return;
        }

        if (backgroundChecked && !backgroundSupported) {
            setBackgroundError("Background effects are not supported in this browser.");
        }
    };

    useEffect(() => {
        if (!backgroundChecked || !backgroundSupported) {
            if (backgroundChecked && backgroundMode !== "none") {
                setBackgroundError("Background effects are not supported in this browser.");
            }
            return;
        }

        const applyBackground = async () => {
            try {
                const videoTrack = localVideoTrackRef.current;
                if (!videoTrack) return;

                setBackgroundError(null);

                if (!backgroundProcessorRef.current) {
                    await attachBackgroundProcessor(videoTrack, backgroundMode);
                    return;
                }

                await backgroundProcessorRef.current.switchTo(getBackgroundSwitchOptions(backgroundMode));
            } catch (error) {
                setBackgroundError(getBackgroundErrorMessage(error));
            }
        };

        void applyBackground();
    }, [attachBackgroundProcessor, backgroundChecked, backgroundMode, backgroundSupported, previewReady]);

    const ensureLocalTracks = useCallback(async () => {
        if (!localVideoTrackRef.current) {
            const videoTrack = await createLocalVideoTrack({
                facingMode: "user",
                resolution: VideoPresets.h360.resolution,
            });

            if (backgroundSupported) {
                await attachBackgroundProcessor(videoTrack, backgroundMode);
            }

            localVideoTrackRef.current = videoTrack;
        }

        if (!localAudioTrackRef.current) {
            localAudioTrackRef.current = await createLocalAudioTrack();
        }
    }, [attachBackgroundProcessor, backgroundMode, backgroundSupported]);

    const publishLocalTracks = useCallback(async () => {
        if (tracksPublished || publishingRef.current) return;

        publishingRef.current = true;

        try {
            await ensureLocalTracks();
            const videoTrack = localVideoTrackRef.current;
            const audioTrack = localAudioTrackRef.current;

            if (videoTrack) {
                await room.localParticipant.publishTrack(videoTrack, { source: Track.Source.Camera });
            }

            if (audioTrack) {
                await room.localParticipant.publishTrack(audioTrack, { source: Track.Source.Microphone });
            }

            setTracksPublished(true);
        } catch (error) {
            setDisconnectReason(error instanceof Error ? error.message : "Could not publish camera or microphone.");
        } finally {
            publishingRef.current = false;
        }
    }, [ensureLocalTracks, room, tracksPublished]);

    const handleJoinClick = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || !previewReady) return;

        void (async () => {
            if (!localAudioTrackRef.current) {
                localAudioTrackRef.current = await createLocalAudioTrack();
            }
            await fetchToken(name.trim(), backgroundMode);
        })();
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
                    <p className="text-sm text-zinc-500 mb-6">Enter your name and choose your camera background before joining.</p>

                    <form onSubmit={handleJoinClick} className="space-y-4">
                        <input
                            autoFocus
                            placeholder="Your Name"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full bg-zinc-50 dark:bg-slate-900 border border-blue-100 dark:border-blue-900/30 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:ring-2 focus:ring-[#012169] dark:text-white transition"
                        />
                        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-slate-950 dark:border-blue-900/30">
                            <div className="aspect-video bg-black">
                                {previewReady ? (
                                    <video ref={previewVideoRef} className="h-full w-full object-cover" autoPlay muted playsInline />
                                ) : (
                                    <div className="flex h-full flex-col items-center justify-center gap-3 text-white/60">
                                        {previewStarting ? <Loader2 className="h-8 w-8 animate-spin" /> : previewError ? <VideoOff className="h-8 w-8" /> : <Video className="h-8 w-8" />}
                                        <p className="max-w-xs px-4 text-center text-xs font-bold leading-5">
                                            {previewError || "Start camera preview before joining."}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={startCameraPreview}
                                            disabled={previewStarting}
                                            className="rounded-xl bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-950 transition hover:bg-blue-50 disabled:opacity-60"
                                        >
                                            {previewStarting ? "Starting" : "Start Camera Preview"}
                                        </button>
                                    </div>
                                )}
                            </div>
                            <div className="p-3">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <p className="text-xs font-black uppercase tracking-widest text-white/70">Background</p>
                                <span className="text-[10px] font-bold text-white/45">
                                    {backgroundChecked ? (backgroundSupported ? "Ready" : "Not supported") : "Checking"}
                                </span>
                            </div>
                            <BackgroundModeSelector value={backgroundMode} supported={backgroundSupported} onChange={handleBackgroundModeChange} />
                            {backgroundError && (
                                <p className="mt-3 rounded-xl border border-amber-300/30 bg-amber-950/80 px-3 py-2 text-xs font-bold leading-5 text-amber-50">
                                    Camera preview is on. Background effect could not be applied: {backgroundError}
                                </p>
                            )}
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={!name.trim() || !previewReady || !!previewError}
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
                <div className="relative w-full h-full rounded-2xl overflow-hidden border border-white/10 bg-black">
                    <LiveKitRoom
                        room={room}
                        video={false}
                        audio={false}
                        token={token}
                        serverUrl={getLivekitUrl()}
                        data-lk-theme="default"
                        style={{ height: "100%" }}
                        connectOptions={{ autoSubscribe: true }}
                        onDisconnected={() => setDisconnected(true)}
                        onConnected={() => {
                            void publishLocalTracks();
                        }}
                        onError={(err) => setDisconnectReason(err?.message || "Unknown error occurred")}
                    >
                        <VideoConference />
                        <RoomAudioRenderer />
                    </LiveKitRoom>
                    <div className="pointer-events-none absolute right-4 top-4 z-20 flex flex-col items-end gap-2">
                        <div className="pointer-events-auto">
                            <BackgroundModeSelector value={backgroundMode} supported={backgroundSupported} onChange={handleBackgroundModeChange} />
                        </div>
                        {backgroundError && (
                            <div className="pointer-events-auto max-w-xs rounded-xl border border-amber-300/30 bg-amber-950/80 px-3 py-2 text-xs font-bold leading-5 text-amber-50">
                                Camera is still live. Background effect could not be applied: {backgroundError}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
