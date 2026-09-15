"use client";

import "@livekit/components-styles";
import {
    LiveKitRoom,
    VideoConference,
    RoomAudioRenderer,
} from "@livekit/components-react";
import {
    createLocalAudioTrack,
    createLocalVideoTrack,
    LocalAudioTrack,
    LocalVideoTrack,
    Room,
    Track,
    VideoPresets,
} from "livekit-client";
import {
    BackgroundProcessor,
    type BackgroundProcessorWrapper,
    supportsBackgroundProcessors,
} from "@livekit/track-processors";
import { useCallback, useEffect, useMemo, useRef, useState, use } from "react";
import { ImageIcon, Loader2, Mic, MicOff, Sparkles, Video, VideoOff, X } from "lucide-react";
import { useRouter } from "next/navigation";

type BackgroundMode = "none" | "blur" | "virtual";

const backgroundModes: Array<{ mode: BackgroundMode; label: string }> = [
    { mode: "none", label: "None" },
    { mode: "blur", label: "Blur" },
    { mode: "virtual", label: "Virtual" },
];

const virtualBackgroundPath = "/backgrounds/britcrm-office.png";

function getBackgroundErrorMessage(error: unknown) {
    if (error instanceof Error && error.message) return error.message;
    if (typeof error === "string" && error.trim()) return error;
    try {
        return JSON.stringify(error);
    } catch {
        return "The browser could not initialize the background processor.";
    }
}

const getAssetPaths = () => {
    if (typeof window === "undefined") return undefined;
    return {
        tasksVisionFileSet: `${window.location.origin}/mediapipe/wasm`,
        modelAssetPath: `${window.location.origin}/mediapipe/selfie_segmenter.tflite`,
    };
};

async function attachBackgroundProcessor(
    track: LocalVideoTrack,
    mode: "blur" | "virtual"
): Promise<BackgroundProcessorWrapper> {
    const assetPaths = getAssetPaths();
    let processor: BackgroundProcessorWrapper;

    try {
        processor = BackgroundProcessor(
            mode === "blur"
                ? {
                    mode: "background-blur",
                    blurRadius: 15,
                    assetPaths,
                }
                : {
                    mode: "virtual-background",
                    imagePath: virtualBackgroundPath,
                    assetPaths,
                }
        );
        await track.setProcessor(processor);
        return processor;
    } catch (localErr) {
        console.warn("Local mediapipe asset loading failed, falling back to CDN:", localErr);
        processor = BackgroundProcessor(
            mode === "blur"
                ? {
                    mode: "background-blur",
                    blurRadius: 15,
                }
                : {
                    mode: "virtual-background",
                    imagePath: virtualBackgroundPath,
                }
        );
        await track.setProcessor(processor);
        return processor;
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
    const [cameraEnabled, setCameraEnabled] = useState(true);
    const [micEnabled, setMicEnabled] = useState(true);
    const [micError, setMicError] = useState<string | null>(null);
    const [tracksPublished, setTracksPublished] = useState(false);

    const previewVideoRef = useRef<HTMLVideoElement | null>(null);
    const localVideoTrackRef = useRef<LocalVideoTrack | null>(null);
    const localAudioTrackRef = useRef<LocalAudioTrack | null>(null);
    const processorRef = useRef<BackgroundProcessorWrapper | null>(null);
    const applyingBackgroundRef = useRef(false);
    const publishingRef = useRef(false);
    const room = useMemo(() => new Room(), []);

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
                setWaitingInfo(null);
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
        if (typeof window !== "undefined") {
            try {
                const supported = supportsBackgroundProcessors();
                setBackgroundSupported(supported);
            } catch {
                setBackgroundSupported(false);
            }
            setBackgroundChecked(true);
        }
    }, []);

    useEffect(() => {
        if (backgroundChecked && !backgroundSupported && backgroundMode !== "none") {
            setBackgroundMode("none");
        }
    }, [backgroundChecked, backgroundMode, backgroundSupported]);

    useEffect(() => {
        return () => {
            room.disconnect();
            const videoTrack = localVideoTrackRef.current;
            if (videoTrack) {
                if (processorRef.current) {
                    void videoTrack.stopProcessor().catch(() => {});
                    processorRef.current = null;
                }
                videoTrack.stop();
            }
            localAudioTrackRef.current?.stop();
        };
    }, [room]);

    const applyBackgroundMode = useCallback(async (targetMode: BackgroundMode) => {
        if (applyingBackgroundRef.current) return;
        applyingBackgroundRef.current = true;

        const currentTrack = localVideoTrackRef.current || (room.localParticipant.getTrackPublication(Track.Source.Camera)?.track as LocalVideoTrack | undefined);

        try {
            setBackgroundError(null);

            if (targetMode === "none") {
                if (processorRef.current) {
                    try {
                        await processorRef.current.switchTo({ mode: "disabled" });
                    } catch {
                        if (currentTrack) {
                            await currentTrack.stopProcessor().catch(() => {});
                        }
                        processorRef.current = null;
                    }
                }
                setBackgroundMode("none");
                if (previewVideoRef.current && currentTrack) {
                    currentTrack.attach(previewVideoRef.current);
                    previewVideoRef.current.srcObject = new MediaStream([currentTrack.mediaStreamTrack]);
                }
                return;
            }

            // targetMode is "blur" or "virtual"
            if (typeof window !== "undefined" && !supportsBackgroundProcessors()) {
                setBackgroundError("Background blur is not supported on this device/browser.");
                setBackgroundMode("none");
                return;
            }

            // If processor already active on the track, switch mode instantly
            if (processorRef.current && currentTrack) {
                if (targetMode === "blur") {
                    await processorRef.current.switchTo({ mode: "background-blur", blurRadius: 15 });
                } else {
                    await processorRef.current.switchTo({ mode: "virtual-background", imagePath: virtualBackgroundPath });
                }
                setBackgroundMode(targetMode);
                if (previewVideoRef.current && processorRef.current.processedTrack) {
                    previewVideoRef.current.srcObject = new MediaStream([processorRef.current.processedTrack]);
                }
                return;
            }

            // Attach new processor to the active track
            if (currentTrack) {
                const processor = await attachBackgroundProcessor(currentTrack, targetMode);
                processorRef.current = processor;
                setBackgroundMode(targetMode);

                if (previewVideoRef.current && processor.processedTrack) {
                    previewVideoRef.current.srcObject = new MediaStream([processor.processedTrack]);
                }
            } else {
                setBackgroundMode(targetMode);
            }
        } catch (err) {
            console.error("Failed to apply background effect:", err);
            setBackgroundError(getBackgroundErrorMessage(err));
            if (currentTrack && processorRef.current) {
                try {
                    await currentTrack.stopProcessor();
                } catch {
                    // ignore
                }
            }
            processorRef.current = null;
            setBackgroundMode("none");
            if (previewVideoRef.current && currentTrack) {
                currentTrack.attach(previewVideoRef.current);
                previewVideoRef.current.srcObject = new MediaStream([currentTrack.mediaStreamTrack]);
            }
        } finally {
            applyingBackgroundRef.current = false;
        }
    }, [room]);

    const stopCameraPreview = useCallback(() => {
        const videoTrack = localVideoTrackRef.current;
        if (videoTrack) {
            if (processorRef.current) {
                void videoTrack.stopProcessor().catch(() => {});
                processorRef.current = null;
            }
            videoTrack.stop();
        }

        localVideoTrackRef.current = null;
        setPreviewReady(false);
        setPreviewError(null);
        setBackgroundError(null);
    }, []);

    const startCameraPreview = useCallback(async () => {
        if (previewStarting || previewReady || hasJoined || waitingInfo || error || isExpired) return;

        try {
            setPreviewStarting(true);
            setPreviewError(null);

            const isMobile = typeof window !== "undefined" && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            const videoTrack = await createLocalVideoTrack({
                facingMode: "user",
                resolution: isMobile ? VideoPresets.h540.resolution : VideoPresets.h720.resolution,
            });

            localVideoTrackRef.current = videoTrack;

            if (backgroundMode !== "none" && typeof window !== "undefined" && supportsBackgroundProcessors()) {
                try {
                    const processor = await attachBackgroundProcessor(videoTrack, backgroundMode);
                    processorRef.current = processor;
                } catch (procErr) {
                    console.warn("Could not apply background effect in startCameraPreview:", procErr);
                    setBackgroundError(getBackgroundErrorMessage(procErr));
                    setBackgroundMode("none");
                }
            }

            setPreviewReady(true);
        } catch (error) {
            localVideoTrackRef.current?.stop();
            localVideoTrackRef.current = null;
            processorRef.current = null;
            setPreviewReady(false);
            setPreviewError(error instanceof Error ? error.message : "Could not start camera preview.");
        } finally {
            setPreviewStarting(false);
        }
    }, [backgroundMode, error, hasJoined, isExpired, previewReady, previewStarting, waitingInfo]);

    const handleCameraToggle = useCallback(() => {
        if (cameraEnabled) {
            setCameraEnabled(false);
            stopCameraPreview();
            return;
        }

        setCameraEnabled(true);
        void startCameraPreview();
    }, [cameraEnabled, startCameraPreview, stopCameraPreview]);

    const handleMicToggle = useCallback(() => {
        if (micEnabled) {
            localAudioTrackRef.current?.stop();
            localAudioTrackRef.current = null;
            setMicEnabled(false);
            setMicError(null);
            return;
        }

        setMicEnabled(true);
        setMicError(null);
    }, [micEnabled]);

    useEffect(() => {
        const videoElement = previewVideoRef.current;
        const videoTrack = localVideoTrackRef.current;

        if (!videoElement || !videoTrack || hasJoined) return;

        videoTrack.attach(videoElement);
        const processedTrack = processorRef.current?.processedTrack || (videoTrack.getProcessor() as BackgroundProcessorWrapper | undefined)?.processedTrack;
        if (processedTrack) {
            videoElement.srcObject = new MediaStream([processedTrack]);
        }
        videoElement.muted = true;
        videoElement.playsInline = true;

        return () => {
            videoTrack.detach(videoElement);
        };
    }, [hasJoined, previewReady, backgroundMode]);

    const handleBackgroundModeChange = (mode: BackgroundMode) => {
        void applyBackgroundMode(mode);
    };

    const ensureLocalTracks = useCallback(async () => {
        if (cameraEnabled && !localVideoTrackRef.current) {
            const isMobile = typeof window !== "undefined" && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            const videoTrack = await createLocalVideoTrack({
                facingMode: "user",
                resolution: isMobile ? VideoPresets.h540.resolution : VideoPresets.h720.resolution,
            });

            localVideoTrackRef.current = videoTrack;

            if (backgroundMode !== "none" && typeof window !== "undefined" && supportsBackgroundProcessors()) {
                try {
                    const processor = await attachBackgroundProcessor(videoTrack, backgroundMode);
                    processorRef.current = processor;
                } catch (procErr) {
                    console.warn("Could not apply background effect in ensureLocalTracks:", procErr);
                    setBackgroundError(getBackgroundErrorMessage(procErr));
                    setBackgroundMode("none");
                }
            }
        }

        if (micEnabled && !localAudioTrackRef.current) {
            try {
                localAudioTrackRef.current = await createLocalAudioTrack();
                setMicError(null);
            } catch (error) {
                setMicError(error instanceof Error ? error.message : "Could not start microphone.");
                throw error;
            }
        }
    }, [backgroundMode, cameraEnabled, micEnabled]);

    const publishLocalTracks = useCallback(async () => {
        if (tracksPublished || publishingRef.current) return;

        publishingRef.current = true;

        try {
            await ensureLocalTracks();
            const videoTrack = localVideoTrackRef.current;
            const audioTrack = localAudioTrackRef.current;

            if (cameraEnabled && videoTrack) {
                await room.localParticipant.publishTrack(videoTrack, { source: Track.Source.Camera });
            }

            if (micEnabled && audioTrack) {
                await room.localParticipant.publishTrack(audioTrack, { source: Track.Source.Microphone });
            }

            setTracksPublished(true);
        } catch (error) {
            setDisconnectReason(error instanceof Error ? error.message : "Could not publish camera or microphone.");
        } finally {
            publishingRef.current = false;
        }
    }, [cameraEnabled, ensureLocalTracks, micEnabled, room, tracksPublished]);

    const handleJoinClick = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim() || previewStarting || (cameraEnabled && !!previewError)) return;

        void fetchToken(name.trim(), cameraEnabled ? backgroundMode : "none");
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
                    <p className="text-sm text-zinc-500 mb-6">Enter your name and choose your camera and microphone before joining.</p>

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
                                {cameraEnabled && previewReady ? (
                                    <video ref={previewVideoRef} className="h-full w-full object-cover" autoPlay muted playsInline />
                                ) : (
                                    <div className="flex h-full flex-col items-center justify-center gap-3 text-white/60">
                                        {previewStarting ? <Loader2 className="h-8 w-8 animate-spin" /> : <VideoOff className="h-8 w-8" />}
                                        <p className="max-w-xs px-4 text-center text-xs font-bold leading-5">
                                            {!cameraEnabled ? "Camera is off. You can still join." : previewError || "Start camera preview or join directly."}
                                        </p>
                                        {cameraEnabled && (
                                            <button
                                                type="button"
                                                onClick={startCameraPreview}
                                                disabled={previewStarting}
                                                className="rounded-xl bg-white px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-950 transition hover:bg-blue-50 disabled:opacity-60"
                                            >
                                                {previewStarting ? "Starting" : "Start Camera Preview"}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                            <div className="p-3">
                            <div className="mb-3 grid grid-cols-2 gap-2">
                                <button
                                    type="button"
                                    onClick={handleCameraToggle}
                                    disabled={previewStarting}
                                    className={`flex min-h-11 items-center justify-center gap-2 rounded-xl text-xs font-black uppercase tracking-widest transition disabled:opacity-60 ${
                                        cameraEnabled ? "bg-white text-slate-950 hover:bg-blue-50" : "bg-red-600 text-white hover:bg-red-500"
                                    }`}
                                >
                                    {cameraEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                                    {cameraEnabled ? "Camera On" : "Camera Off"}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleMicToggle}
                                    className={`flex min-h-11 items-center justify-center gap-2 rounded-xl text-xs font-black uppercase tracking-widest transition ${
                                        micEnabled ? "bg-white text-slate-950 hover:bg-blue-50" : "bg-red-600 text-white hover:bg-red-500"
                                    }`}
                                >
                                    {micEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                                    {micEnabled ? "Mic On" : "Mic Off"}
                                </button>
                            </div>
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <p className="text-xs font-black uppercase tracking-widest text-white/70">Background</p>
                                <span className="text-[10px] font-bold text-white/45">
                                    {!cameraEnabled ? "Camera off" : backgroundChecked ? (backgroundSupported ? "Ready" : "Not supported") : "Checking"}
                                </span>
                            </div>
                            <BackgroundModeSelector value={backgroundMode} supported={cameraEnabled && backgroundSupported} onChange={handleBackgroundModeChange} />
                            {backgroundError && (
                                <p className="mt-3 rounded-xl border border-amber-300/30 bg-amber-950/80 px-3 py-2 text-xs font-bold leading-5 text-amber-50">
                                    Camera preview is on. Background effect could not be applied: {backgroundError}
                                </p>
                            )}
                            {micError && (
                                <p className="mt-3 rounded-xl border border-amber-300/30 bg-amber-950/80 px-3 py-2 text-xs font-bold leading-5 text-amber-50">
                                    Microphone could not be started: {micError}
                                </p>
                            )}
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={!name.trim() || previewStarting || (cameraEnabled && !!previewError)}
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
