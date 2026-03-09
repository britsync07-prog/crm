"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import {
    Send, Loader2, Users, Hash, MessageSquare, Plus,
    ChevronRight, ZapIcon, Link as LinkIcon, CheckCircle2, ShieldAlert,
    MoreHorizontal, Lock, Settings
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface Message {
    id: string;
    content: string;
    createdAt: string;
    user: {
        id: string;
        name: string | null;
        email: string;
        image?: string | null;
    };
}

interface OnlineUser {
    userId: string;
    name: string;
}

interface Channel {
    id: string;
    name: string;
    isPrivate?: boolean;
    allowedRoles?: { id: string; name: string; color: string }[];
}

interface WorkspaceRoomProps {
    workspaceId: string;
    workspaceName: string;
    workspaceDescription?: string | null;
    channels: Channel[];
    initialMessages: Message[];
    currentUser: { id: string; name: string; email: string };
    members: {
        userId: string;
        role: string;
        nickname?: string | null;
        user: { id: string; name: string | null; email: string; image?: string | null };
        customRoles: { id: string; name: string; color: string }[];
    }[];
    customRoles: { id: string; name: string; color: string }[];
    isOwner: boolean;
    isAdmin: boolean;
}

function getInitials(name: string | null | undefined, email: string): string {
    if (name) return name.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase();
    return email[0].toUpperCase();
}

function getAvatarColor(userId: string): string {
    const colors = [
        "bg-blue-500", "bg-purple-500", "bg-green-500", "bg-orange-500",
        "bg-pink-500", "bg-teal-500", "bg-indigo-500", "bg-rose-500"
    ];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
        hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
}

export default function WorkspaceRoom({
    workspaceId,
    workspaceName,
    workspaceDescription,
    channels: initialChannels,
    initialMessages,
    currentUser,
    members,
    customRoles,
    isAdmin,
}: WorkspaceRoomProps) {
    const router = useRouter();
    const [socket, setSocket] = useState<Socket | null>(null);
    const [connected, setConnected] = useState(false);

    // Channels & Messages
    const [channels, setChannels] = useState<Channel[]>(initialChannels);
    const [activeChannelId, setActiveChannelId] = useState<string>(channels[0]?.id || "");
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);

    // Inputs
    const [input, setInput] = useState("");
    const [sending, setSending] = useState(false);

    // Users & Presence
    const [membersList, setMembersList] = useState(members);
    const [onlineUsers, setOnlineUsers] = useState<OnlineUser[]>([]);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);

    const [isCreatingChannel, setIsCreatingChannel] = useState(false);
    const [newChannelName, setNewChannelName] = useState("");
    const [inviteLink, setInviteLink] = useState<string | null>(null);
    const [copiedInvite, setCopiedInvite] = useState(false);

    // Edit Channel State
    const [editingChannelId, setEditingChannelId] = useState<string | null>(null);
    const [editChannelName, setEditChannelName] = useState("");
    const [editChannelIsPrivate, setEditChannelIsPrivate] = useState(false);

    // Custom Roles State
    const [availableRoles, setAvailableRoles] = useState(customRoles);
    const [isCreatingRole, setIsCreatingRole] = useState(false);
    const [newRoleName, setNewRoleName] = useState("");
    const [newRoleColor, setNewRoleColor] = useState("#6366f1");

    // Role Settings Modal
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // active channel object
    const activeChannel = channels.find(c => c.id === activeChannelId);

    // Scroll to bottom
    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, typingUsers, activeChannelId, scrollToBottom]);

    // Socket.IO lifecycle
    useEffect(() => {
        const newSocket = io(window.location.origin, {
            path: "/socket.io",
            transports: ["polling", "websocket"],
        });

        newSocket.on("connect", () => {
            setConnected(true);

            // Join Workspace (for general presence)
            newSocket.emit("join-workspace", {
                workspaceId,
                userId: currentUser.id,
                userName: currentUser.name || currentUser.email,
            });

            // Join the active channel (for isolated chat routing)
            if (activeChannelId) {
                newSocket.emit("join-channel", { channelId: activeChannelId });
            }
        });

        newSocket.on("disconnect", () => setConnected(false));
        newSocket.on("presence:update", setOnlineUsers);

        newSocket.on("chat:message", (message: Message & { channelId: string }) => {
            // Only add if it belongs to the currently active channel
            if (message.channelId === activeChannelId) {
                setMessages(prev => {
                    if (prev.some(m => m.id === message.id)) return prev;
                    return [...prev, message];
                });
            }
        });

        newSocket.on("chat:typing", ({ userName, isTyping }: { userName: string; isTyping: boolean }) => {
            setTypingUsers(prev =>
                isTyping
                    ? prev.includes(userName) ? prev : [...prev, userName]
                    : prev.filter(u => u !== userName)
            );
        });

        setSocket(newSocket);

        return () => {
            if (activeChannelId) newSocket.emit("leave-channel", { channelId: activeChannelId });
            newSocket.emit("leave-workspace", { workspaceId });
            newSocket.disconnect();
        };
    }, [workspaceId, currentUser.id, currentUser.name, currentUser.email, activeChannelId]);

    // Switch channels
    const handleChannelSwitch = async (channelId: string) => {
        if (channelId === activeChannelId) return;

        // Leave old channel, join new channel
        if (socket && connected) {
            socket.emit("leave-channel", { channelId: activeChannelId });
            socket.emit("join-channel", { channelId });
        }

        setActiveChannelId(channelId);
        setMessages([]); // Clear while loading
        setIsLoadingHistory(true);
        setTypingUsers([]);

        try {
            const res = await fetch(`/api/channels/${channelId}/messages`);
            if (res.ok) {
                const data = await res.json();
                setMessages(data.messages);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsLoadingHistory(false);
            inputRef.current?.focus();
        }
    };

    const sendMessage = useCallback(async () => {
        if (!input.trim() || !socket || !connected || !activeChannelId) return;
        setSending(true);

        const content = input.trim();
        setInput("");

        socket.emit("chat:typing", {
            channelId: activeChannelId,
            userName: currentUser.name || currentUser.email,
            isTyping: false
        });

        socket.emit("chat:message", {
            workspaceId,
            channelId: activeChannelId,
            userId: currentUser.id,
            content,
        });

        setSending(false);
        inputRef.current?.focus();
    }, [input, socket, connected, workspaceId, activeChannelId, currentUser]);

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInput(e.target.value);
        if (!socket || !connected || !activeChannelId) return;

        socket.emit("chat:typing", {
            channelId: activeChannelId,
            userName: currentUser.name || currentUser.email,
            isTyping: true
        });

        if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
        typingTimerRef.current = setTimeout(() => {
            socket?.emit("chat:typing", {
                channelId: activeChannelId,
                userName: currentUser.name || currentUser.email,
                isTyping: false
            });
        }, 2000);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    // Actions
    const createChannel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newChannelName.trim()) return;
        try {
            const res = await fetch(`/api/workspaces/${workspaceId}/channels`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newChannelName })
            });
            if (res.ok) {
                const channel = await res.json();
                setChannels(prev => [...prev, channel]);
                setIsCreatingChannel(false);
                setNewChannelName("");
                handleChannelSwitch(channel.id);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const updateChannel = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingChannelId || !editChannelName.trim()) return;
        try {
            const res = await fetch(`/api/workspaces/${workspaceId}/channels/${editingChannelId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: editChannelName, isPrivate: editChannelIsPrivate })
            });
            if (res.ok) {
                const updated = await res.json();
                setChannels(prev => prev.map(c =>
                    c.id === editingChannelId
                        ? { ...c, name: updated.name, isPrivate: updated.isPrivate }
                        : c
                ));
                setEditingChannelId(null);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const generateInvite = async () => {
        try {
            const res = await fetch(`/api/workspaces/${workspaceId}/invite`, { method: "POST" });
            if (res.ok) {
                const invite = await res.json();
                const link = `${window.location.origin}/invite/${invite.id}`;
                setInviteLink(link);
                navigator.clipboard.writeText(link);
                setCopiedInvite(true);
                setTimeout(() => setCopiedInvite(false), 3000);
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Roles & Nickname Management
    const [openMenuId, setOpenMenuId] = useState<string | null>(null);
    const [renamingUserId, setRenamingUserId] = useState<string | null>(null);
    const [newNickname, setNewNickname] = useState("");

    const changeNickname = async (targetUserId: string, nickname: string) => {
        try {
            const res = await fetch(`/api/workspaces/${workspaceId}/members/${targetUserId}/nickname`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nickname })
            });
            if (res.ok) {
                setMembersList(prev => prev.map(m => m.userId === targetUserId ? { ...m, nickname: nickname || null } : m));
            }
        } catch (err) {
            console.error("Failed to change nickname", err);
        } finally {
            setRenamingUserId(null);
        }
    };

    const changeRole = async (targetUserId: string, newRole: "ADMIN" | "MEMBER") => {
        setOpenMenuId(null);
        try {
            const res = await fetch(`/api/workspaces/${workspaceId}/members/${targetUserId}/role`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: newRole })
            });
            if (res.ok) {
                setMembersList(prev => prev.map(m => m.userId === targetUserId ? { ...m, role: newRole } : m));
            }
        } catch (err) {
            console.error("Failed to change role", err);
        }
    };

    const createCustomRole = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRoleName.trim()) return;
        try {
            const res = await fetch(`/api/workspaces/${workspaceId}/roles`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newRoleName, color: newRoleColor })
            });
            if (res.ok) {
                const role = await res.json();
                setAvailableRoles(prev => [...prev, role]);
                setIsRoleModalOpen(false);
                setNewRoleName("");
            }
        } catch (err) {
            console.error(err);
        }
    };

    const updateCustomRole = async () => {
        if (!editingRoleId || !newRoleName.trim()) return;

        // Find which channels this role is currently allowed in (to send array of IDs)
        const allowedChannelIds = channels.filter(c => c.allowedRoles?.some(r => r.id === editingRoleId)).map(c => c.id);

        try {
            const res = await fetch(`/api/workspaces/${workspaceId}/roles/${editingRoleId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newRoleName, color: newRoleColor, allowedChannelIds })
            });
            if (res.ok) {
                const updatedRole = await res.json();
                setAvailableRoles(prev => prev.map(r => r.id === editingRoleId ? updatedRole : r));
                setMembersList(prev => prev.map(m => ({
                    ...m,
                    customRoles: m.customRoles.map(cr => cr.id === editingRoleId ? { ...cr, name: updatedRole.name, color: updatedRole.color } : cr)
                })));
                setIsRoleModalOpen(false);
                setEditingRoleId(null);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const toggleCustomRole = async (targetUserId: string, roleId: string, hasRole: boolean) => {
        try {
            const method = hasRole ? "DELETE" : "POST";
            const url = hasRole
                ? `/api/workspaces/${workspaceId}/members/${targetUserId}/custom-roles?roleId=${roleId}`
                : `/api/workspaces/${workspaceId}/members/${targetUserId}/custom-roles`;

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: hasRole ? undefined : JSON.stringify({ roleId })
            });

            if (res.ok) {
                const roleToAdd = availableRoles.find((r: any) => r.id === roleId);
                setMembersList(prev => prev.map((m: any) => {
                    if (m.userId !== targetUserId) return m;
                    const customRoles = hasRole
                        ? m.customRoles.filter((r: any) => r.id !== roleId)
                        : roleToAdd ? [...m.customRoles, roleToAdd] : m.customRoles;
                    return { ...m, customRoles };
                }));
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Grouping
    const groupedMessages: { date: string; msgs: Message[] }[] = [];
    for (const msg of messages) {
        const date = new Date(msg.createdAt).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
        const last = groupedMessages[groupedMessages.length - 1];
        if (last && last.date === date) {
            last.msgs.push(msg);
        } else {
            groupedMessages.push({ date, msgs: [msg] });
        }
    }

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-white dark:bg-[#0f0f10] rounded-xl border border-zinc-200 dark:border-zinc-800">

            {/* Left: Channels Sidebar */}
            <div className="w-60 border-r border-zinc-100 dark:border-zinc-800 flex flex-col bg-zinc-50 dark:bg-zinc-950 shrink-0">
                <div className="p-4 border-b border-zinc-100 dark:border-zinc-800">
                    <Link href="/workspaces" className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300 mb-3">
                        <ChevronRight className="w-3 h-3 rotate-180" />
                        <span>All Workspaces</span>
                    </Link>
                    <h2 className="font-bold text-zinc-900 dark:text-zinc-100 text-[15px] flex items-center justify-between">
                        <span className="flex items-center gap-2 truncate">
                            <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center shrink-0">
                                <ZapIcon className="w-3.5 h-3.5 text-white" />
                            </div>
                            <span className="truncate">{workspaceName}</span>
                        </span>
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto py-3 space-y-4">
                    {/* Channels List */}
                    <div>
                        <div className="flex items-center justify-between px-4 mb-2">
                            <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Channels</h3>
                            {isAdmin && (
                                <button onClick={() => setIsCreatingChannel(true)} className="text-zinc-400 hover:text-indigo-600">
                                    <Plus className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {isCreatingChannel && (
                            <form onSubmit={createChannel} className="px-3 mb-2">
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder="new-channel"
                                    value={newChannelName}
                                    onChange={e => setNewChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                    onBlur={() => !newChannelName && setIsCreatingChannel(false)}
                                    className="w-full text-sm bg-zinc-200 dark:bg-zinc-900 border-none rounded px-2 py-1 outline-none focus:ring-1 focus:ring-indigo-500 dark:text-white"
                                />
                            </form>
                        )}

                        <div className="px-2 space-y-0.5">
                            {(() => {
                                const currentUserData = membersList.find(m => m.userId === currentUser.id);
                                const isUserAdmin = isAdmin || currentUserData?.role === "ADMIN";
                                const userRoleIds = currentUserData?.customRoles.map(r => r.id) || [];

                                const visibleChannels = channels.filter(channel => {
                                    if (!channel.isPrivate) return true; // Public channels always visible
                                    if (isUserAdmin) return true; // Admins always see everything
                                    // Otherwise, check if user has a role that's in the allowedRoles list
                                    return channel.allowedRoles?.some(allowed => userRoleIds.includes(allowed.id));
                                });

                                return visibleChannels.map(channel => {
                                    const isActive = channel.id === activeChannelId;
                                    return (
                                        <button
                                            key={channel.id}
                                            onClick={() => handleChannelSwitch(channel.id)}
                                            className={`group w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                                ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300"
                                                : "text-zinc-600 hover:bg-zinc-200/50 dark:text-zinc-400 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-200"
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 min-w-0 pr-2">
                                                <Hash className={`w-4 h-4 shrink-0 ${isActive ? 'text-indigo-500' : 'text-zinc-400'}`} />
                                                <span className="truncate">{channel.name}</span>
                                            </div>
                                            <div className="flex items-center gap-1 shrink-0">
                                                {channel.isPrivate && (
                                                    <Lock className={`w-3 h-3 ${isActive ? 'text-indigo-400' : 'text-zinc-400'}`} />
                                                )}
                                                {isAdmin && (
                                                    <div
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setEditingChannelId(channel.id);
                                                            setEditChannelName(channel.name);
                                                            setEditChannelIsPrivate(channel.isPrivate || false);
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-zinc-300 dark:hover:bg-zinc-700 rounded transition-opacity"
                                                    >
                                                        <Settings className="w-3.5 h-3.5 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200" />
                                                    </div>
                                                )}
                                            </div>
                                        </button>
                                    );
                                });
                            })()}
                        </div>
                    </div>
                </div>

                {/* Invite Button at bottom */}
                {isAdmin && (
                    <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 mt-auto">
                        <button
                            onClick={generateInvite}
                            className="w-full flex items-center justify-center gap-2 py-2 bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-200 dark:text-zinc-900 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                            {copiedInvite ? <CheckCircle2 className="w-4 h-4 text-green-500" /> : <LinkIcon className="w-4 h-4" />}
                            {copiedInvite ? "Copied Link!" : "Invite People"}
                        </button>
                    </div>
                )}
            </div>

            {/* Main: Chat area */}
            <div className="flex-1 flex flex-col min-w-0 bg-white dark:bg-[#0f0f10]">
                {/* Header */}
                <div className="h-14 shrink-0 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between px-5 shadow-sm z-10">
                    <div className="flex items-center gap-3">
                        <Hash className="w-5 h-5 text-zinc-400" />
                        <span className="font-bold text-[15px] text-zinc-900 dark:text-zinc-100">
                            {activeChannel?.name || "Select a channel"}
                        </span>
                        {isLoadingHistory && <Loader2 className="w-4 h-4 text-zinc-400 animate-spin ml-2" />}
                    </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto py-4 px-3 sm:px-5 space-y-1">
                    {messages.length === 0 && !isLoadingHistory && (
                        <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-20">
                            <div className="w-16 h-16 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                <Hash className="w-8 h-8 text-indigo-500" />
                            </div>
                            <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-xl">Welcome to #{activeChannel?.name}</h3>
                            <p className="text-zinc-500 text-sm max-w-sm">This is the start of the <strong>#{activeChannel?.name}</strong> channel. No messages have been sent yet.</p>
                        </div>
                    )}

                    {groupedMessages.map(({ date, msgs }) => (
                        <div key={date}>
                            <div className="flex items-center gap-3 mt-6 mb-2">
                                <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800" />
                                <span className="text-[11px] font-bold text-zinc-400 px-1">{date}</span>
                                <div className="flex-1 h-px bg-zinc-100 dark:bg-zinc-800" />
                            </div>

                            {msgs.map((msg, i) => {
                                const isSelf = msg.user.id === currentUser.id;
                                const prevMsg = msgs[i - 1];
                                const isGrouped = prevMsg && prevMsg.user.id === msg.user.id;

                                return (
                                    <div key={msg.id} className={`flex items-start gap-3 group hover:bg-zinc-50 dark:hover:bg-white/[0.02] px-2 py-0.5 rounded-lg ${isGrouped ? "mt-0" : "mt-4"}`}>
                                        {!isGrouped ? (
                                            <div className={`w-10 h-10 rounded-full ${getAvatarColor(msg.user.id)} flex items-center justify-center text-white text-sm font-bold shrink-0 mt-0.5 cursor-pointer`}>
                                                {getInitials(msg.user.name, msg.user.email)}
                                            </div>
                                        ) : (
                                            <div className="w-10 shrink-0 text-right pr-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center">
                                                <span className="text-[10px] text-zinc-400 tabular-nums">
                                                    {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false })}
                                                </span>
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0 max-w-full block">
                                            {!isGrouped && (
                                                <div className="flex items-baseline gap-2 mb-0.5">
                                                    {(() => {
                                                        const memberData = membersList.find(m => m.userId === msg.user.id);
                                                        const highestRole = memberData?.customRoles?.[0]; // Assume first is highest
                                                        const nameColor = highestRole ? highestRole.color : (isSelf ? '#4f46e5' : 'inherit');

                                                        return (
                                                            <span
                                                                className={`text-[15px] hover:underline cursor-pointer font-semibold ${!highestRole && !isSelf ? 'text-zinc-900 dark:text-zinc-100' : ''}`}
                                                                style={{ color: highestRole || isSelf ? nameColor : undefined }}
                                                            >
                                                                {msg.user.name || msg.user.email.split("@")[0]}
                                                            </span>
                                                        );
                                                    })()}
                                                    <span className="text-xs text-zinc-400 font-medium">
                                                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="text-[15px] text-zinc-800 dark:text-zinc-200 leading-normal whitespace-pre-wrap break-words">{msg.content}</div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ))}

                    {/* Typing indicator */}
                    {typingUsers.length > 0 && (
                        <div className="flex items-center gap-2 px-4 py-2 mt-2">
                            <div className="flex gap-1 items-center bg-zinc-100 dark:bg-zinc-800 px-3 py-1.5 rounded-full">
                                <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:0ms]" />
                                <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:150ms]" />
                                <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:300ms]" />
                            </div>
                            <span className="text-xs font-medium text-zinc-500">
                                {typingUsers.join(", ")} {typingUsers.length === 1 ? "is" : "are"} typing...
                            </span>
                        </div>
                    )}

                    <div ref={messagesEndRef} className="h-4" />
                </div>

                {/* Input area */}
                <div className="shrink-0 px-5 pb-6 pt-2">
                    <div className="bg-zinc-100 dark:bg-zinc-800/50 rounded-lg overflow-hidden border border-zinc-200 dark:border-zinc-700/50 focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all shadow-sm">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={handleInput}
                            onKeyDown={handleKeyDown}
                            placeholder={activeChannel ? `Message #${activeChannel.name}` : "Select a channel to chat"}
                            disabled={!activeChannelId || !connected}
                            rows={1}
                            style={{ resize: "none", minHeight: "44px", maxHeight: "400px", overflow: "auto" }}
                            className="w-full bg-transparent border-none outline-none ring-0 text-[15px] text-zinc-900 dark:text-zinc-100 placeholder-zinc-500 px-4 py-3 pb-1"
                        />
                        <div className="flex items-center justify-between px-2 pb-2">
                            <div className="flex items-center gap-1">
                                <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${connected ? 'text-green-600 bg-green-500/10' : 'text-zinc-500 bg-zinc-500/10'}`}>
                                    <div className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-green-500' : 'bg-zinc-400'}`} />
                                    {connected ? 'Connected' : 'Connecting...'}
                                </div>
                            </div>
                            <button
                                onClick={sendMessage}
                                disabled={!input.trim() || !connected || sending}
                                className="w-8 h-8 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-indigo-600 rounded flex items-center justify-center text-white transition-all shrink-0"
                            >
                                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 ml-0.5" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right: Members Sidebar */}
            <div className="w-56 border-l border-zinc-100 dark:border-zinc-800 flex flex-col bg-zinc-50 dark:bg-zinc-950 shrink-0 hidden lg:flex">
                <div className="flex-1 overflow-y-auto p-4 space-y-6">
                    {/* Custom Roles Grouping */}
                    {(() => {
                        const displayedUserIds = new Set<string>();

                        // 1. Map through available Custom Roles
                        const roleGroups = availableRoles.map((role: any) => {
                            const usersInRole = membersList.filter((m: any) => m.customRoles.some((cr: any) => cr.id === role.id) && !displayedUserIds.has(m.userId));
                            usersInRole.forEach((u: any) => displayedUserIds.add(u.userId));
                            return { role, users: usersInRole };
                        }).filter((g: any) => g.users.length > 0);

                        // 2. Map Admins (who aren't already displayed)
                        const adminUsers = membersList.filter((m: any) => (m.role === "ADMIN" || workspaceId === m.userId) && !displayedUserIds.has(m.userId));
                        adminUsers.forEach((u: any) => displayedUserIds.add(u.userId));

                        // 3. Map Members (who aren't already displayed)
                        const normalUsers = membersList.filter((m: any) => !displayedUserIds.has(m.userId));

                        return (
                            <>
                                {roleGroups.map((group: any) => (
                                    <div key={group.role.id}>
                                        <h3 className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: group.role.color }}>
                                            {group.role.name} — {group.users.length}
                                        </h3>
                                        <div className="space-y-[1px]">
                                            {group.users.map((m: any) => renderUser(m, true))}
                                        </div>
                                    </div>
                                ))}

                                {adminUsers.length > 0 && (
                                    <div>
                                        <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                                            Admins — {adminUsers.length}
                                        </h3>
                                        <div className="space-y-[1px]">
                                            {adminUsers.map((m: any) => renderUser(m, true))}
                                        </div>
                                    </div>
                                )}

                                {normalUsers.length > 0 && (
                                    <div>
                                        <h3 className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                                            Members — {normalUsers.length}
                                        </h3>
                                        <div className="space-y-[1px]">
                                            {normalUsers.map((m: any) => renderUser(m, false))}
                                        </div>
                                    </div>
                                )}
                            </>
                        );

                        function renderUser(m: typeof membersList[0], isAdminList: boolean) {
                            const isOnline = onlineUsers.some(u => u.userId === m.user.id);
                            return (
                                <div key={m.userId}
                                    className="flex items-center gap-2.5 p-1.5 -mx-1.5 rounded hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50 group cursor-pointer transition-colors relative"
                                    onClick={() => isAdmin ? setOpenMenuId(openMenuId === m.user.id ? null : m.user.id) : null}
                                    onMouseLeave={() => setOpenMenuId(null)}
                                >
                                    <div className="relative pointer-events-none">
                                        <div className={`w-8 h-8 rounded-full ${getAvatarColor(m.user.id)} flex items-center justify-center text-white text-xs font-bold opacity-${isOnline ? '100' : '50 group-hover:opacity-100'}`}>
                                            {getInitials(m.user.name, m.user.email)}
                                        </div>
                                        <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-zinc-50 dark:border-zinc-950 ${isOnline ? 'bg-green-500' : 'bg-zinc-400'}`} />
                                    </div>
                                    <span className={`text-[14px] truncate flex-1 font-medium ${isOnline ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-500 dark:text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-200'}`}
                                        style={{ color: m.customRoles?.[0]?.color }}
                                    >
                                        {m.user.name || m.user.email.split("@")[0]}
                                    </span>
                                    {isAdmin && (
                                        <MoreHorizontal className="w-4 h-4 text-zinc-400 opacity-0 group-hover:opacity-100 shrink-0" />
                                    )}

                                    {/* Dropdown Menu */}
                                    {openMenuId === m.user.id && isAdmin && (
                                        <div className="absolute right-0 top-10 w-48 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg z-50 py-1 overflow-visible"
                                            onClick={e => e.stopPropagation()}>

                                            {/* Custom Role Toggles */}
                                            {availableRoles.length > 0 && (
                                                <div className="px-3 py-1.5 border-b border-zinc-100 dark:border-zinc-800 mb-1">
                                                    <span className="text-[10px] uppercase font-bold text-zinc-500">Assign Role</span>
                                                    <div className="mt-1 space-y-1">
                                                        {availableRoles.map((role: any) => {
                                                            const hasRole = m.customRoles.some((cr: any) => cr.id === role.id);
                                                            return (
                                                                <button
                                                                    key={role.id}
                                                                    onClick={() => toggleCustomRole(m.userId, role.id, hasRole)}
                                                                    className="w-full flex items-center justify-between px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-sm"
                                                                >
                                                                    <span className="flex items-center gap-2">
                                                                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: role.color }} />
                                                                        <span className="text-zinc-700 dark:text-zinc-300">{role.name}</span>
                                                                    </span>
                                                                    {hasRole && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            )}

                                            <button
                                                onClick={() => {
                                                    setNewNickname(m.nickname || m.user.name || m.user.email.split("@")[0]);
                                                    setRenamingUserId(m.userId);
                                                    setOpenMenuId(null);
                                                }}
                                                className="w-full text-left px-3 py-1.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium"
                                            >
                                                Change Nickname
                                            </button>

                                            {m.role === "ADMIN" ? (
                                                <button
                                                    onClick={() => changeRole(m.user.id, "MEMBER")}
                                                    className="w-full text-left px-3 py-2 text-sm text-amber-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:text-amber-500 font-medium"
                                                >
                                                    Demote to Member
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => changeRole(m.user.id, "ADMIN")}
                                                    className="w-full text-left px-3 py-2 text-sm text-indigo-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:text-indigo-400 font-medium"
                                                >
                                                    Promote to Admin
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        }
                    })()}

                </div>

                {/* Role Management button at bottom of users list */}
                {isAdmin && (
                    <div className="p-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
                        <button
                            onClick={() => setIsRoleModalOpen(true)}
                            className="w-full text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-indigo-600 dark:hover:text-indigo-400 py-1.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                        >
                            <ShieldAlert className="w-4 h-4" /> Manage Roles
                        </button>
                    </div>
                )}
            </div>

            {/* Role Settings Modal */}
            {isRoleModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl w-full max-w-2xl flex overflow-hidden max-h-[85vh]">
                        {/* Left sidebar - Role List */}
                        <div className="w-48 bg-zinc-50 dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 flex flex-col">
                            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800">
                                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-[13px] uppercase tracking-wider">Roles</h3>
                            </div>
                            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                                <button
                                    onClick={() => setEditingRoleId(null)}
                                    className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${!editingRoleId ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'}`}
                                >
                                    <div className="flex items-center gap-2">
                                        <Plus className="w-4 h-4" />
                                        <span>Create Role</span>
                                    </div>
                                </button>

                                <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-2 mx-2" />

                                {availableRoles.map((role: any) => (
                                    <button
                                        key={role.id}
                                        onClick={() => {
                                            setEditingRoleId(role.id);
                                            setNewRoleName(role.name);
                                            setNewRoleColor(role.color);
                                        }}
                                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${editingRoleId === role.id ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300' : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/50 dark:hover:bg-zinc-800/50'}`}
                                    >
                                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: role.color }} />
                                        <span className="truncate">{role.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Right side - Edit/Create Form */}
                        <div className="flex-1 flex flex-col bg-white dark:bg-zinc-900">
                            {/* Header */}
                            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                                    {editingRoleId ? 'Edit Role' : 'Create New Role'}
                                </h2>
                                <button onClick={() => setIsRoleModalOpen(false)} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                </button>
                            </div>

                            {/* Body */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-6">
                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Role Name</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Graphic Designer"
                                        value={newRoleName}
                                        onChange={e => setNewRoleName(e.target.value)}
                                        className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Role Color</label>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg shrink-0 border border-zinc-200 dark:border-zinc-800 shadow-sm" style={{ backgroundColor: newRoleColor || '#6366f1' }} />
                                        <input
                                            type="color"
                                            value={newRoleColor || '#6366f1'}
                                            onChange={e => setNewRoleColor(e.target.value)}
                                            className="h-10 w-full cursor-pointer bg-transparent border-0 p-0"
                                        />
                                    </div>
                                </div>

                                {editingRoleId && (
                                    <>
                                        <div className="h-px bg-zinc-200 dark:bg-zinc-800" />
                                        <div>
                                            <div className="mb-3">
                                                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Channel Permissions</h4>
                                                <p className="text-xs text-zinc-500 mt-0.5">Select which Private Channels this role is allowed to view.</p>
                                            </div>

                                            <div className="border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden bg-zinc-50 dark:bg-zinc-950 divide-y divide-zinc-200 dark:divide-zinc-800">
                                                {channels.map(channel => {
                                                    const isAllowed = channel.allowedRoles?.some(r => r.id === editingRoleId) || false;
                                                    return (
                                                        <div key={channel.id} className="flex items-center justify-between p-3">
                                                            <div className="flex items-center gap-2">
                                                                <Hash className="w-4 h-4 text-zinc-400" />
                                                                <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{channel.name}</span>
                                                                {channel.isPrivate && <Lock className="w-3 h-3 text-indigo-400 ml-1" />}
                                                                {!channel.isPrivate && <span className="text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded font-bold uppercase ml-2">Public</span>}
                                                            </div>
                                                            {channel.isPrivate && (
                                                                <label className="relative inline-flex items-center cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        className="sr-only peer"
                                                                        checked={isAllowed}
                                                                        onChange={(e) => {
                                                                            const roleBeingEdited = availableRoles.find((r: any) => r.id === editingRoleId);
                                                                            if (!roleBeingEdited) return;

                                                                            // Immediate UI update, then updateCustomRole takes care of the API on Save
                                                                            setChannels(prev => prev.map(c => {
                                                                                if (c.id !== channel.id) return c;
                                                                                const newAllowed = isAllowed
                                                                                    ? (c.allowedRoles || []).filter(r => r.id !== editingRoleId)
                                                                                    : [...(c.allowedRoles || []), roleBeingEdited];
                                                                                return { ...c, allowedRoles: newAllowed };
                                                                            }));
                                                                        }}
                                                                    />
                                                                    <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                                                                </label>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Footer / Actions */}
                            <div className="p-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex justify-between items-center rounded-br-xl">
                                {editingRoleId ? (
                                    <button
                                        onClick={async () => {
                                            if (confirm("Are you sure you want to delete this role?")) {
                                                await fetch(`/api/workspaces/${workspaceId}/roles/${editingRoleId}`, { method: 'DELETE' });
                                                setAvailableRoles(prev => prev.filter((r: any) => r.id !== editingRoleId));
                                                setEditingRoleId(null);
                                            }
                                        }}
                                        className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                                    >
                                        Delete Role
                                    </button>
                                ) : <div />}

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setIsRoleModalOpen(false)}
                                        className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={editingRoleId ? updateCustomRole : createCustomRole}
                                        className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                                    >
                                        {editingRoleId ? 'Save Changes' : 'Create Role'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Channel Modal */}
            {editingChannelId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden">
                        <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                                Edit Channel
                            </h2>
                            <button onClick={() => setEditingChannelId(null)} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={updateChannel} className="p-5 space-y-5">
                            <div>
                                <label className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">Channel Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. general"
                                    value={editChannelName}
                                    onChange={e => setEditChannelName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 dark:text-white"
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="block text-sm font-bold text-zinc-900 dark:text-zinc-100">Private Channel</label>
                                    <p className="text-xs text-zinc-500 mt-0.5">Only specific roles will be able to access this.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={editChannelIsPrivate}
                                        onChange={(e) => setEditChannelIsPrivate(e.target.checked)}
                                    />
                                    <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-zinc-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>

                            <div className="pt-4 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingChannelId(null)}
                                    className="px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!editChannelName.trim()}
                                    className="px-4 py-2 text-sm font-medium bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg transition-colors"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
