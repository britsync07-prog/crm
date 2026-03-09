"use client";

import { useState, useEffect, useMemo } from "react";
import {
    Mail, Inbox, Send, Trash2, Archive, Search, Filter, Bot,
    ArrowLeft, Loader2, Reply, CheckCircle2, ChevronDown,
    MoreVertical, FileText, Star, Clock, AlertCircle
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface EmailItem {
    id: string;
    from: string;
    subject: string;
    snippet: string;
    date: string;
    sentiment: string;
    aiSummary: string;
    isRead: boolean;
    isStarred?: boolean;
    mailbox: string;
}

interface FullEmail extends EmailItem {
    to: string;
    html: string;
    text: string;
}

export default function InboxClient({
    initialEmails,
    emailAccounts,
    initialActiveAccountId
}: {
    initialEmails: EmailItem[],
    emailAccounts: any[],
    initialActiveAccountId?: string
}) {
    const router = useRouter();
    const [activeAccountId, setActiveAccountId] = useState(initialActiveAccountId || (emailAccounts.length > 0 ? emailAccounts[0].id : ""));
    const [activeFolder, setActiveFolder] = useState("INBOX");
    const [emails, setEmails] = useState<EmailItem[]>(initialEmails);
    const [loading, setLoading] = useState(false);

    // Selection state for batch actions
    const [selectedEmailIds, setSelectedEmailIds] = useState<Set<string>>(new Set());

    const [selectedEmail, setSelectedEmail] = useState<FullEmail | null>(null);
    const [loadingEmail, setLoadingEmail] = useState(false);

    // Search
    const [searchQuery, setSearchQuery] = useState("");

    // Compose / Reply
    const [isComposing, setIsComposing] = useState(false);
    const [composeTo, setComposeTo] = useState("");
    const [composeSubject, setComposeSubject] = useState("");
    const [composeBody, setComposeBody] = useState("");
    const [sending, setSending] = useState(false);
    const [sendStatus, setSendStatus] = useState<{ ok: boolean; message: string } | null>(null);

    // Action feedback
    const [actionError, setActionError] = useState<string | null>(null);

    // UI state
    const [accountDropdownOpen, setAccountDropdownOpen] = useState(false);

    const folders = [
        { name: "Inbox", imapFolder: "INBOX", icon: Inbox },
        { name: "Starred", imapFolder: "STARRED", fallback: "Starred", icon: Star },
        { name: "Sent", imapFolder: "SENT", fallback: "Sent", icon: Send },
        { name: "Drafts", imapFolder: "DRAFTS", fallback: "Drafts", icon: FileText },
        { name: "Spam", imapFolder: "SPAM", fallback: "Junk", icon: AlertCircle },
        { name: "Trash", imapFolder: "TRASH", fallback: "Trash", icon: Trash2 }
    ];

    // Filtered emails based on search query
    const filteredEmails = useMemo(() => {
        if (!searchQuery.trim()) return emails;
        const q = searchQuery.toLowerCase();
        return emails.filter(e =>
            e.from.toLowerCase().includes(q) ||
            e.subject.toLowerCase().includes(q) ||
            e.snippet.toLowerCase().includes(q)
        );
    }, [emails, searchQuery]);

    const activeAccount = emailAccounts.find(a => a.id === activeAccountId);

    const fetchFolder = async (folder: string, accountId: string = activeAccountId) => {
        setActiveFolder(folder);
        setSelectedEmail(null);
        setSelectedEmailIds(new Set());
        setSearchQuery("");
        setLoading(true);
        setActionError(null);
        try {
            const res = await fetch(`/api/emails?mailbox=${encodeURIComponent(folder)}&accountId=${accountId}`);
            const data = await res.json();
            if (!res.ok) {
                setActionError(data.error || "Failed to load emails.");
                setEmails([]);
            } else {
                setEmails(data.emails || []);
            }
        } catch (e: any) {
            setActionError(e.message || "Network error.");
            setEmails([]);
        } finally {
            setLoading(false);
        }
    };

    const switchAccount = (accountId: string) => {
        setActiveAccountId(accountId);
        setAccountDropdownOpen(false);
        fetchFolder("INBOX", accountId); // Always default to Inbox when switching accounts
    };

    const openEmail = async (email: EmailItem) => {
        setLoadingEmail(true);
        setSelectedEmail({ ...email, to: "Loading...", html: "", text: "" });
        setActionError(null);

        // Optimistically mark as read in the list view
        if (!email.isRead) {
            setEmails(prev => prev.map(m => m.id === email.id ? { ...m, isRead: true } : m));
        }

        try {
            const res = await fetch(`/api/emails/${email.id}?mailbox=${encodeURIComponent(activeFolder)}&accountId=${activeAccountId}`);
            const data = await res.json();
            if (res.ok && data.email) {
                setSelectedEmail({ ...email, ...data.email, isRead: true });
            } else {
                setActionError(data.error || "Could not load email body.");
                setSelectedEmail(null);
                // Revert read status if fetch failed
                if (!email.isRead) {
                    setEmails(prev => prev.map(m => m.id === email.id ? { ...m, isRead: false } : m));
                }
            }
        } catch (e: any) {
            setActionError(e.message);
            setSelectedEmail(null);
        } finally {
            if (!email.isRead) {
                fetch(`/api/emails/${email.id}`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'read', mailbox: activeFolder, accountId: activeAccountId })
                }).catch(() => { });
            }
            setLoadingEmail(false);
        }
    };

    const handleAction = async (emailId: string, action: 'archive' | 'trash' | 'spam' | 'read' | 'unread') => {
        setActionError(null);
        // Optimistic update
        if (action !== 'read' && action !== 'unread') {
            setEmails(prev => prev.filter(m => m.id !== emailId));
            if (selectedEmail?.id === emailId) setSelectedEmail(null);
            selectedEmailIds.delete(emailId);
            setSelectedEmailIds(new Set(selectedEmailIds));
        } else {
            setEmails(prev => prev.map(m => m.id === emailId ? { ...m, isRead: action === 'read' } : m));
        }

        try {
            const res = await fetch(`/api/emails/${emailId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, mailbox: activeFolder, accountId: activeAccountId })
            });
            if (!res.ok) {
                const d = await res.json().catch(() => ({}));
                setActionError(d.error || `Failed to ${action} email.`);
            }
        } catch (e: any) {
            setActionError(e.message);
        }
    };

    const handleBatchAction = async (action: 'archive' | 'trash' | 'spam' | 'read' | 'unread') => {
        if (selectedEmailIds.size === 0) return;

        const idsToProcess = Array.from(selectedEmailIds);

        // Optimistic UI update for all selected emails
        if (action !== 'read' && action !== 'unread') {
            setEmails(prev => prev.filter(m => !selectedEmailIds.has(m.id)));
            setSelectedEmailIds(new Set());
        } else {
            setEmails(prev => prev.map(m => selectedEmailIds.has(m.id) ? { ...m, isRead: action === 'read' } : m));
        }

        // In a real production app, you'd want a batch endpoint to handle this in one round trip.
        // For now, we process them sequentially or in parallel depending on the API structure.
        for (const id of idsToProcess) {
            fetch(`/api/emails/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action, mailbox: activeFolder, accountId: activeAccountId })
            }).catch(e => console.error(`Failed to ${action} email ${id}`, e));
        }
    };

    const openReply = () => {
        if (!selectedEmail) return;
        setComposeTo(selectedEmail.from);
        setComposeSubject(`Re: ${selectedEmail.subject}`);
        setComposeBody(`\n\n---\nOn ${selectedEmail.date}, ${selectedEmail.from} wrote:\n> ${selectedEmail.snippet}`);
        setIsComposing(true);
    };

    const handleSend = async () => {
        if (!composeTo || !composeBody) return;
        setSending(true);
        setSendStatus(null);
        try {
            const res = await fetch('/api/emails', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accountId: activeAccountId,
                    to: composeTo,
                    subject: composeSubject || "(No Subject)",
                    body: composeBody
                })
            });
            const data = await res.json().catch(() => ({}));
            if (res.ok) {
                setSendStatus({ ok: true, message: "Message sent" });
                setTimeout(() => {
                    setIsComposing(false);
                    setComposeTo("");
                    setComposeSubject("");
                    setComposeBody("");
                    setSendStatus(null);
                }, 1500);
            } else {
                setSendStatus({ ok: false, message: data?.error || "Failed to send email." });
            }
        } catch (e: any) {
            setSendStatus({ ok: false, message: e.message || "Network error." });
        } finally {
            setSending(false);
        }
    };

    const toggleEmailSelection = (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        const newSet = new Set(selectedEmailIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedEmailIds(newSet);
    };

    const toggleAllSelection = () => {
        if (selectedEmailIds.size === filteredEmails.length && filteredEmails.length > 0) {
            setSelectedEmailIds(new Set());
        } else {
            setSelectedEmailIds(new Set(filteredEmails.map(e => e.id)));
        }
    };

    return (
        <div className="h-[calc(100vh-100px)] flex flex-col bg-white dark:bg-zinc-950 font-sans">
            {/* Global error banner */}
            {actionError && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-zinc-900 text-white text-sm rounded-lg shadow-xl flex items-center justify-between min-w-[300px]">
                    <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4 text-red-400" /> {actionError}</span>
                    <button onClick={() => setActionError(null)} className="ml-4 text-zinc-400 hover:text-white">✕</button>
                </div>
            )}

            {/* Top Navigation Bar (Gmail style header) */}
            <div className="h-16 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between px-6 bg-white dark:bg-zinc-950 shrink-0">
                <div className="flex items-center gap-4 w-64 shrink-0">
                    <span className="text-xl font-medium tracking-tight text-zinc-800 dark:text-zinc-100 flex items-center gap-2">
                        <Mail className="w-6 h-6 text-blue-600 dark:text-blue-500" />
                        Inbox
                    </span>
                </div>

                <div className="flex-1 max-w-2xl px-8">
                    <div className="relative flex items-center w-full bg-zinc-100 dark:bg-zinc-900 rounded-full focus-within:bg-white focus-within:shadow-md focus-within:ring-1 border border-transparent focus-within:border-zinc-200 dark:focus-within:border-zinc-700 transition-all">
                        <span className="pl-4 text-zinc-500"><Search className="w-5 h-5" /></span>
                        <input
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search mail"
                            className="w-full bg-transparent border-none px-4 py-3 text-sm focus:outline-none focus:ring-0 dark:text-zinc-100 placeholder-zinc-500"
                        />
                        {searchQuery && (
                            <button onClick={() => setSearchQuery("")} className="pr-4 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300">
                                ✕
                            </button>
                        )}
                        <span className="pr-4 text-zinc-500"><Filter className="w-5 h-5 cursor-pointer hover:text-zinc-800" /></span>
                    </div>
                </div>

                <div className="w-64 flex justify-end shrink-0 relative">
                    {activeAccount ? (
                        <div>
                            <button
                                onClick={() => setAccountDropdownOpen(!accountDropdownOpen)}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                            >
                                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-medium shadow-sm">
                                    {activeAccount.email[0].toUpperCase()}
                                </div>
                                <div className="text-left hidden lg:block">
                                    <div className="text-xs font-medium text-zinc-900 dark:text-zinc-100">{activeAccount.email}</div>
                                </div>
                                <ChevronDown className="w-4 h-4 text-zinc-500" />
                            </button>

                            {accountDropdownOpen && (
                                <div className="absolute top-12 right-0 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-xl py-2 z-50">
                                    <div className="px-4 py-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider">Switch Account</div>
                                    {emailAccounts.map(acc => (
                                        <button
                                            key={acc.id}
                                            onClick={() => switchAccount(acc.id)}
                                            className={`w-full text-left px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 flex items-center gap-3 ${activeAccountId === acc.id ? 'bg-zinc-50 dark:bg-zinc-800' : ''}`}
                                        >
                                            <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 flex items-center justify-center font-medium">
                                                {acc.email[0].toUpperCase()}
                                            </div>
                                            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">{acc.email}</span>
                                        </button>
                                    ))}
                                    <div className="border-t border-zinc-100 dark:border-zinc-800 mt-2 pt-2">
                                        <Link href="/settings/email" className="w-full text-left px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 flex items-center gap-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                                            <span>+ Set up another account</span>
                                        </Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link href="/settings/email" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700">
                            Connect Account
                        </Link>
                    )}
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative">

                {/* Sidebar */}
                <div className="w-64 flex flex-col pt-4 shrink-0 transition-all duration-300">
                    <div className="px-4 mb-4">
                        <button
                            onClick={() => {
                                setComposeTo("");
                                setComposeSubject("");
                                setComposeBody("");
                                setSendStatus(null);
                                setIsComposing(true);
                            }}
                            className="bg-[#c2e7ff] hover:bg-[#b5e0fc] dark:bg-blue-300 dark:hover:bg-blue-400 text-[#001d35] font-medium rounded-2xl py-4 px-6 shadow-sm transition-all flex items-center gap-3 group w-auto inline-flex">
                            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                            <span className="pr-2">Compose</span>
                        </button>
                    </div>

                    <nav className="flex-1 space-y-0.5 pr-4">
                        {folders.map(item => {
                            const isActive = activeFolder === item.imapFolder || activeFolder === item.fallback;
                            return (
                                <button
                                    key={item.name}
                                    onClick={() => fetchFolder(item.imapFolder)}
                                    className={`w-full flex items-center justify-between pl-6 pr-4 py-2 rounded-r-full transition-all ${isActive ? 'bg-[#d3e3fd] text-[#0b57d0] dark:bg-blue-900/30 dark:text-blue-400 font-bold' : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800/50'}`}>
                                    <div className="flex items-center gap-4">
                                        <item.icon className="w-4 h-4 stroke-[2px]" />
                                        <span className="text-sm font-medium">{item.name}</span>
                                    </div>
                                    {item.name === "Inbox" && (
                                        <span className="text-xs font-bold">{emails.filter(e => !e.isRead).length || ''}</span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-[#121212] rounded-t-2xl sm:mr-4 border border-zinc-200 border-b-0 dark:border-zinc-800">

                    {selectedEmail ? (
                        // Full Email Reading View
                        <div className="flex-1 flex flex-col overflow-hidden h-full">
                            {/* Toolbar */}
                            <div className="h-14 border-b border-zinc-200 dark:border-zinc-800 px-4 flex items-center justify-between shrink-0">
                                <div className="flex items-center gap-2">
                                    <button onClick={() => setSelectedEmail(null)} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition-colors" title="Back to Inbox">
                                        <ArrowLeft className="w-5 h-5" />
                                    </button>

                                    <div className="w-px h-6 bg-zinc-200 dark:bg-zinc-700 mx-2"></div>

                                    <button onClick={() => handleAction(selectedEmail.id, 'archive')} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400" title="Archive"><Archive className="w-4 h-4" /></button>
                                    <button onClick={() => handleAction(selectedEmail.id, 'spam')} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400" title="Report spam"><AlertCircle className="w-4 h-4" /></button>
                                    <button onClick={() => handleAction(selectedEmail.id, 'trash')} className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-zinc-500">
                                    <span>{selectedEmail.date}</span>
                                </div>
                            </div>

                            <div className="flex-1 overflow-auto bg-white dark:bg-[#121212]">
                                <div className="p-8 max-w-5xl mx-auto">
                                    {/* Subject */}
                                    <div className="flex items-center justify-between mb-8 pl-16">
                                        <h1 className="text-2xl font-normal text-zinc-900 dark:text-zinc-100">{selectedEmail.subject}</h1>
                                        <button className={`text-zinc-400 hover:text-yellow-400 transition-colors ${selectedEmail.isStarred ? 'text-yellow-400 fill-yellow-400' : ''}`}>
                                            <Star className="w-5 h-5" />
                                        </button>
                                    </div>

                                    {/* Header */}
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 flex items-center justify-center font-medium text-lg shrink-0">
                                                {selectedEmail.from[0]?.toUpperCase() || '?'}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100">{selectedEmail.from}</span>
                                                </div>
                                                <div className="text-xs text-zinc-500 mt-0.5">to {selectedEmail.to}</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Body */}
                                    <div className="pl-16 pr-4 mb-20 relative min-h-[300px]">
                                        {loadingEmail ? (
                                            <div className="flex items-center justify-center h-32">
                                                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                            </div>
                                        ) : (
                                            <div className="w-full text-zinc-800 dark:text-zinc-200 leading-relaxed font-sans text-sm">
                                                {selectedEmail.html ? (
                                                    <iframe
                                                        title="Email Content"
                                                        srcDoc={`
                                                            <!DOCTYPE html>
                                                            <html>
                                                            <head>
                                                                <style>
                                                                    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.5; color: #202124; margin: 0; padding: 0; font-size: 14px; background-color: transparent; }
                                                                    a { color: #1a73e8; text-decoration: none; }
                                                                    a:hover { text-decoration: underline; }
                                                                    img { max-width: 100%; height: auto; }
                                                                    @media (prefers-color-scheme: dark) {
                                                                        body { color: #e8eaed; }
                                                                        a { color: #8ab4f8; }
                                                                    }
                                                                </style>
                                                            </head>
                                                            <body>${selectedEmail.html}</body>
                                                            </html>
                                                        `}
                                                        className="w-full h-[600px] border-none bg-transparent"
                                                        sandbox="allow-popups allow-popups-to-escape-sandbox allow-same-origin"
                                                        onLoad={(e) => {
                                                            const iframe = e.target as HTMLIFrameElement;
                                                            if (iframe.contentWindow) {
                                                                iframe.style.height = iframe.contentWindow.document.documentElement.scrollHeight + 'px';
                                                            }
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="whitespace-pre-wrap">{selectedEmail.text || selectedEmail.snippet}</div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {/* Inline Gmail-style Reply Box */}
                                    {!loadingEmail && (
                                        <div className="pl-16">
                                            {isComposing && composeSubject.startsWith("Re:") ? (
                                                <div className="border border-zinc-200 dark:border-zinc-700 rounded-xl overflow-hidden shadow-sm flex flex-col focus-within:shadow-md transition-shadow">
                                                    <div className="flex items-center px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/30">
                                                        <span className="text-sm text-zinc-500"><Reply className="w-4 h-4 inline mr-2" /> Reply to <span className="font-semibold">{selectedEmail.from}</span></span>
                                                    </div>
                                                    <textarea
                                                        value={composeBody}
                                                        onChange={e => setComposeBody(e.target.value)}
                                                        className="w-full p-4 min-h-[150px] bg-white dark:bg-zinc-900 border-none outline-none resize-none text-sm dark:text-zinc-100"
                                                        autoFocus
                                                    />
                                                    <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-zinc-900 border-t border-zinc-100 dark:border-zinc-800">
                                                        <button
                                                            onClick={handleSend}
                                                            disabled={sending || !composeBody.trim()}
                                                            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-full font-medium text-sm flex items-center gap-2 disabled:opacity-50">
                                                            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send"}
                                                        </button>
                                                        <button onClick={() => setIsComposing(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex gap-4">
                                                    <button onClick={openReply} className="px-6 py-2 rounded-full border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 font-medium text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2">
                                                        <Reply className="w-4 h-4" /> Reply
                                                    </button>
                                                    <button onClick={openReply} className="px-6 py-2 rounded-full border border-zinc-300 dark:border-zinc-600 text-zinc-600 dark:text-zinc-300 font-medium text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center gap-2">
                                                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 17 4 12 9 7"></polyline><path d="M20 18v-2a4 4 0 0 0-4-4H4"></path></svg>
                                                        Forward
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Email Thread List View
                        <div className="flex-1 flex flex-col overflow-hidden">
                            {/* Toolbar */}
                            <div className="h-12 border-b border-zinc-100 dark:border-zinc-800 px-4 flex items-center bg-white dark:bg-[#121212] shrink-0 sticky top-0 z-10 gap-3">
                                <div className="flex items-center hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded p-1">
                                    <input
                                        type="checkbox"
                                        checked={selectedEmailIds.size > 0 && selectedEmailIds.size === filteredEmails.length}
                                        onChange={toggleAllSelection}
                                        className="w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                    <ChevronDown className="w-3 h-3 text-zinc-500 ml-1" />
                                </div>
                                <button className="w-8 h-8 rounded flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500" onClick={() => fetchFolder(activeFolder)}>
                                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 2v6h-6"></path><path d="M3 12a9 9 0 1 0 2.13-5.88L21 8"></path></svg>
                                </button>
                                <button className="w-8 h-8 rounded flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500">
                                    <MoreVertical className="w-4 h-4" />
                                </button>

                                {selectedEmailIds.size > 0 && (
                                    <>
                                        <div className="w-px h-5 bg-zinc-200 dark:bg-zinc-700 mx-1"></div>
                                        <button onClick={() => handleBatchAction('archive')} className="w-8 h-8 rounded flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" title="Archive"><Archive className="w-4 h-4" /></button>
                                        <button onClick={() => handleBatchAction('spam')} className="w-8 h-8 rounded flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" title="Report spam"><AlertCircle className="w-4 h-4" /></button>
                                        <button onClick={() => handleBatchAction('trash')} className="w-8 h-8 rounded flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                    </>
                                )}

                                <div className="ml-auto text-xs text-zinc-500">
                                    {filteredEmails.length > 0 ? `1-${filteredEmails.length} of ${filteredEmails.length}` : ''}
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto bg-white dark:bg-[#121212]">
                                {loading ? (
                                    <div className="flex items-center justify-center h-40">
                                        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                                    </div>
                                ) : filteredEmails.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-zinc-500">
                                        <Inbox className="w-12 h-12 mb-4 text-zinc-300 dark:text-zinc-700" />
                                        <div className="text-base">Nothing to see here</div>
                                        {searchQuery && <div className="text-sm mt-1">No results for "{searchQuery}"</div>}
                                    </div>
                                ) : (
                                    <table className="w-full table-fixed text-sm">
                                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                                            {filteredEmails.map((thread) => (
                                                <tr
                                                    key={thread.id}
                                                    onClick={() => openEmail(thread)}
                                                    className={`group cursor-pointer hover:shadow-[inset_1px_0_0_#dadce0,inset_-1px_0_0_#dadce0,0_1px_2px_0_rgba(60,64,67,.3),0_1px_3px_1px_rgba(60,64,67,.15)] dark:hover:shadow-[inset_1px_0_0_#3c4043,inset_-1px_0_0_#3c4043,0_1px_2px_0_rgba(0,0,0,.3),0_1px_3px_1px_rgba(0,0,0,.15)] hover:z-10 relative transition-none
                                                        ${!thread.isRead ? 'bg-white dark:bg-[#121212] font-bold text-zinc-900 dark:text-zinc-100' : 'bg-[#f2f6fc] dark:bg-[#1a1a1a] text-zinc-700 dark:text-zinc-300'}
                                                        ${selectedEmailIds.has(thread.id) ? 'bg-blue-50 dark:bg-blue-900/10' : ''}
                                                    `}>

                                                    {/* Actions cell (Checkbox, Star) */}
                                                    <td className="w-16 py-0 px-4 whitespace-nowrap align-middle">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-5 flex justify-center" onClick={(e) => toggleEmailSelection(e, thread.id)}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={selectedEmailIds.has(thread.id)}
                                                                    onChange={() => { }} // dummy onChange to prevent warning, actual logic is in parent div onClick
                                                                    className={`w-4 h-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer ${selectedEmailIds.has(thread.id) ? 'opacity-100' : 'opacity-30 group-hover:opacity-100'}`}
                                                                />
                                                            </div>
                                                            <button onClick={(e) => { e.stopPropagation(); }} className={`transition-colors ${thread.isStarred ? 'text-yellow-400 fill-yellow-400' : 'text-zinc-400 group-hover:text-zinc-500 hover:text-yellow-400'}`}>
                                                                <Star className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>

                                                    {/* Sender */}
                                                    <td className="w-48 py-2.5 pr-2 truncate align-middle">
                                                        <span>{thread.from}</span>
                                                    </td>

                                                    {/* Subject & Snippet */}
                                                    <td className="py-2.5 pr-4 truncate align-middle">
                                                        <span className="">{thread.subject}</span>
                                                        <span className="text-zinc-500 dark:text-zinc-400 font-normal mx-2">-</span>
                                                        <span className="text-zinc-500 dark:text-zinc-400 font-normal">{thread.snippet}</span>
                                                    </td>

                                                    {/* Hover Actions / Date */}
                                                    <td className="w-32 py-2.5 px-4 text-right whitespace-nowrap align-middle text-xs font-semibold">
                                                        <div className="group-hover:hidden truncate">
                                                            {thread.date.split(' ')[0]} {/* Display date only to mimic Gmail, or format smartly */}
                                                        </div>
                                                        <div className="hidden group-hover:flex items-center justify-end gap-2 pr-2">
                                                            <button onClick={(e) => { e.stopPropagation(); handleAction(thread.id, 'archive'); }} className="p-1.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400" title="Archive"><Archive className="w-4 h-4" /></button>
                                                            <button onClick={(e) => { e.stopPropagation(); handleAction(thread.id, 'trash'); }} className="p-1.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400" title="Delete"><Trash2 className="w-4 h-4" /></button>
                                                            <button onClick={(e) => { e.stopPropagation(); handleAction(thread.id, 'read'); }} className="p-1.5 rounded-full hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-500 dark:text-zinc-400" title="Mark as read"><Mail className="w-4 h-4" /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Standalone Compose Modal (used when composing a completely new email, not replying) */}
                {isComposing && !composeSubject.startsWith("Re:") && (
                    <div className="absolute bottom-0 right-24 w-[500px] h-[500px] bg-white dark:bg-zinc-900 rounded-t-xl shadow-[0_8px_30px_rgb(0,0,0,0.12),0_4px_4px_rgb(0,0,0,0.06)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.6)] flex flex-col z-50 border border-zinc-200 dark:border-zinc-800">
                        <div className="px-4 py-3 bg-zinc-800 dark:bg-zinc-800 rounded-t-xl flex justify-between items-center text-white">
                            <h3 className="text-sm font-medium tracking-wide">New Message</h3>
                            <div className="flex items-center gap-2">
                                <button onClick={() => { setIsComposing(false); setSendStatus(null); }} className="hover:bg-zinc-700 p-1 rounded">✕</button>
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto flex flex-col">
                            {sendStatus && (
                                <div className={`p-2 text-xs font-medium text-center ${sendStatus.ok ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'}`}>
                                    {sendStatus.message}
                                </div>
                            )}
                            <div className="border-b border-zinc-100 dark:border-zinc-800 focus-within:shadow-sm">
                                <input
                                    type="email"
                                    value={composeTo}
                                    onChange={e => setComposeTo(e.target.value)}
                                    placeholder="Recipients"
                                    className="w-full bg-transparent border-none px-4 py-2 text-sm focus:outline-none focus:ring-0 dark:text-zinc-100"
                                />
                            </div>
                            <div className="border-b border-zinc-100 dark:border-zinc-800 focus-within:shadow-sm">
                                <input
                                    type="text"
                                    value={composeSubject}
                                    onChange={e => setComposeSubject(e.target.value)}
                                    placeholder="Subject"
                                    className="w-full bg-transparent border-none px-4 py-2 text-sm focus:outline-none focus:ring-0 dark:text-zinc-100"
                                />
                            </div>
                            <div className="flex-1 p-4 pb-0">
                                <textarea
                                    value={composeBody}
                                    onChange={e => setComposeBody(e.target.value)}
                                    className="w-full h-full min-h-[250px] bg-transparent border-none outline-none resize-none text-sm dark:text-zinc-100"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <div className="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                            <button
                                onClick={handleSend}
                                disabled={sending || !composeTo.trim() || !composeBody.trim()}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full font-medium text-sm shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
                                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send"}
                            </button>
                            <div className="flex items-center gap-2">
                                <button onClick={() => { setIsComposing(false); setSendStatus(null); }} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
