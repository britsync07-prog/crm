"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Sparkles, CheckCircle2, Loader2, XCircle } from "lucide-react";

export default function OrgInvitePage() {
  const { token } = useParams<{ token: string }>();
  const [invite, setInvite] = useState<{
    email: string;
    organizationName: string;
    plan: string;
    status: string;
  } | null>(null);
  const [user, setUser] = useState<{ id: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/auth/me").then((r) => r.json()),
      fetch(`/api/organization/invite/${token}`).then((r) => r.json()),
    ])
      .then(([u, inv]) => {
        if (u.id) setUser(u);
        if (inv.email) setInvite(inv);
        else setError(inv.error || "Invalid invite");
      })
      .catch(() => setError("Failed to load invite"))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleAccept() {
    setAccepting(true);
    setError(null);
    try {
      const res = await fetch(`/api/organization/invite/${token}/accept`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setDone(true);
      } else {
        setError(data.error || "Failed to accept invite");
      }
    } catch {
      setError("Network error");
    }
    setAccepting(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#012169]" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center p-6">
        <div className="max-w-md w-full p-12 rounded-[40px] bg-[#012169] text-white text-center space-y-6">
          <CheckCircle2 className="w-16 h-16 mx-auto" />
          <h1 className="text-3xl font-black">You're in!</h1>
          <p className="text-blue-200 font-medium">
            You've joined <strong>{invite?.organizationName}</strong>.
          </p>
          <Link
            href="/"
            className="inline-block px-10 py-4 rounded-[16px] bg-white text-[#012169] font-black uppercase tracking-widest text-[10px] hover:scale-95 transition-all"
          >
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center p-6">
        <div className="max-w-md w-full p-12 rounded-[40px] bg-white/5 border border-white/10 text-center space-y-6">
          <XCircle className="w-16 h-16 text-red-400 mx-auto" />
          <h1 className="text-3xl font-black text-white">Invalid Invite</h1>
          <p className="text-zinc-400">{error}</p>
          <Link
            href="/"
            className="inline-block px-10 py-4 rounded-[16px] bg-[#012169] text-white font-black uppercase tracking-widest text-[10px] hover:bg-[#012169]/90 transition-all"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center p-6">
      <div className="max-w-md w-full p-12 rounded-[40px] bg-white/5 border border-white/10 text-center space-y-8">
        <div className="w-16 h-16 rounded-2xl bg-[#012169] flex items-center justify-center mx-auto">
          <Sparkles className="w-8 h-8 text-white" />
        </div>

        <div className="space-y-3">
          <h1 className="text-3xl font-black text-white">You're Invited!</h1>
          <p className="text-zinc-400 font-medium">
            Join <strong className="text-white">{invite?.organizationName}</strong> on BritCRM
          </p>
          <p className="text-sm text-zinc-500">
            Invite sent to: <span className="font-bold text-zinc-300">{invite?.email}</span>
          </p>
        </div>

        {user ? (
          user.email === invite?.email ? (
            <button
              onClick={handleAccept}
              disabled={accepting}
              className="w-full py-5 rounded-[20px] bg-[#012169] text-white font-black uppercase tracking-[0.2em] text-[10px] hover:bg-[#012169]/90 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
            >
              {accepting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Accept Invitation"
              )}
            </button>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-red-400 font-medium">
                This invite was sent to a different email address.
              </p>
              <p className="text-xs text-zinc-500">
                Logged in as <strong>{user.email}</strong>. Please log out and sign in with{" "}
                <strong>{invite?.email}</strong>.
              </p>
              <Link
                href="/login"
                className="inline-block px-8 py-4 rounded-[16px] bg-[#012169] text-white font-black uppercase tracking-widest text-[10px] hover:bg-[#012169]/90 transition-all"
              >
                Switch Account
              </Link>
            </div>
          )
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-zinc-400">
              Create an account to accept this invitation.
            </p>
            <Link
              href={`/signup?invite=${token}`}
              className="block w-full py-5 rounded-[20px] bg-[#012169] text-white font-black uppercase tracking-[0.2em] text-[10px] hover:bg-[#012169]/90 transition-all"
            >
              Create Account & Accept
            </Link>
            <p className="text-xs text-zinc-500">
              Already have an account?{" "}
              <Link href={`/login?invite=${token}`} className="text-[#012169] font-bold hover:underline">
                Log in
              </Link>
            </p>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-400 font-medium">{error}</p>
        )}
      </div>
    </div>
  );
}
