"use client";

import { useState, useTransition } from "react";
import { updateProfileAction, changePasswordAction } from "./actions";
import { 
  User, 
  Mail, 
  Lock, 
  ShieldCheck, 
  Building2, 
  Calendar, 
  Bell, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  ExternalLink,
  Camera
} from "lucide-react";
import { toast } from "react-hot-toast";

interface UserProfileData {
  id: string;
  name: string | null;
  email: string;
  role: string;
  status: string;
  image: string | null;
  newsletterOptedIn: boolean;
  createdAt: string;
  organizationName?: string;
  organizationPlan?: string;
}

export default function ProfileSettingsClient({ user }: { user: UserProfileData }) {
  // Profile state
  const [name, setName] = useState(user.name || "");
  const [email, setEmail] = useState(user.email || "");
  const [image, setImage] = useState(user.image || "");
  const [newsletterOptedIn, setNewsletterOptedIn] = useState(user.newsletterOptedIn ?? true);
  const [isSavingProfile, startSavingProfile] = useTransition();

  // Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isChangingPass, startChangingPass] = useTransition();

  // Avatar presets
  const AVATAR_PRESETS = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
  ];

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("image", image);
    formData.append("newsletterOptedIn", String(newsletterOptedIn));

    startSavingProfile(async () => {
      const res = await updateProfileAction(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.message || "Profile updated successfully!");
      }
    });
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("New password must be at least 6 characters long");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New password and confirmation do not match");
      return;
    }

    const formData = new FormData();
    formData.append("currentPassword", currentPassword);
    formData.append("newPassword", newPassword);
    formData.append("confirmPassword", confirmPassword);

    startChangingPass(async () => {
      const res = await changePasswordAction(formData);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.message || "Password updated successfully!");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }
    });
  };

  const getInitials = (n: string, e: string) => {
    if (n && n.trim()) {
      const parts = n.trim().split(" ");
      if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      return n.slice(0, 2).toUpperCase();
    }
    return e.slice(0, 2).toUpperCase();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-8 py-8 sm:py-12 space-y-12 pb-32">
      {/* Header */}
      <div className="space-y-3 pb-4 border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-[1.5rem] bg-[#012169] flex items-center justify-center shadow-xl shadow-blue-900/20 text-white">
            <User className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-black italic uppercase tracking-tighter text-zinc-900 dark:text-zinc-50 leading-none">
              Account & Profile
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-400 mt-1">
              Personal Identity • Security Credentials • CRM Context
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Profile Form & Password Form (8 cols) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Card 1: Personal Details */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#012169] dark:text-blue-400 flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black uppercase italic tracking-tight text-zinc-900 dark:text-zinc-100">
                    Profile Details
                  </h2>
                  <p className="text-xs text-zinc-500">Your name and contact identity displayed across the CRM</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-6">
              {/* Avatar section */}
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-100 dark:border-zinc-800/80">
                <div className="relative group">
                  <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-[#012169] to-[#c8102e] flex items-center justify-center text-white text-2xl font-black shadow-lg">
                    {image ? (
                      <img
                        src={image}
                        alt="Profile avatar"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback if broken image URL
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : (
                      getInitials(name, email)
                    )}
                  </div>
                </div>

                <div className="flex-1 space-y-2 text-center sm:text-left">
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
                    Avatar Image
                  </p>
                  <input
                    type="url"
                    value={image}
                    onChange={(e) => setImage(e.target.value)}
                    placeholder="https://example.com/your-avatar.jpg"
                    className="w-full text-xs bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-[#012169]"
                  />
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Presets:</span>
                    {AVATAR_PRESETS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setImage(preset)}
                        className="w-6 h-6 rounded-full overflow-hidden border border-zinc-300 dark:border-zinc-700 hover:scale-110 transition-transform"
                      >
                        <img src={preset} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                      </button>
                    ))}
                    {image && (
                      <button
                        type="button"
                        onClick={() => setImage("")}
                        className="text-[10px] text-red-500 hover:underline ml-2"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400 block">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Alexander Vance"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#012169]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400 block">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. alex@company.com"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#012169]"
                    />
                  </div>
                  <p className="text-[10px] text-zinc-400">
                    Used for signing in and receiving meeting notifications, lead alerts, and system reports.
                  </p>
                </div>
              </div>

              {/* Preferences */}
              <div className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
                <div className="space-y-1 pr-4">
                  <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
                    <Bell className="w-3.5 h-3.5 text-[#012169] dark:text-blue-400" />
                    Product Updates & Newsletter
                  </p>
                  <p className="text-[11px] text-zinc-500">
                    Receive announcements regarding new CRM features, integrations, and performance enhancements.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNewsletterOptedIn((v) => !v)}
                  className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors ${
                    newsletterOptedIn ? "bg-[#012169] justify-end" : "bg-zinc-300 dark:bg-zinc-700 justify-start"
                  }`}
                >
                  <div className="w-4 h-4 rounded-full bg-white shadow-sm" />
                </button>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="rounded-xl bg-[#012169] px-6 py-3 text-xs font-black uppercase tracking-widest text-white hover:bg-zinc-900 transition-all shadow-xl shadow-blue-900/10 flex items-center gap-2 disabled:opacity-50"
                >
                  {isSavingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Save Profile
                </button>
              </div>
            </form>
          </div>

          {/* Card 2: Password & Credentials */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black uppercase italic tracking-tight text-zinc-900 dark:text-zinc-100">
                    Change Password
                  </h2>
                  <p className="text-xs text-zinc-500">Update your secret credentials to keep your CRM data secure</p>
                </div>
              </div>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400 block">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPass ? "text" : "password"}
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Enter your current password"
                    className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#012169]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400 block">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPass ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#012169]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400 block">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPass ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#012169]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                    >
                      {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              {newPassword && (
                <div className="text-[11px] font-bold text-zinc-500 pt-1 flex items-center gap-2">
                  {newPassword.length >= 6 ? (
                    <span className="text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Length valid (6+ chars)
                    </span>
                  ) : (
                    <span className="text-amber-600 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Needs at least 6 characters
                    </span>
                  )}
                  {confirmPassword && (
                    newPassword === confirmPassword ? (
                      <span className="text-green-600 flex items-center gap-1 ml-3">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Passwords match
                      </span>
                    ) : (
                      <span className="text-red-500 flex items-center gap-1 ml-3">
                        <AlertCircle className="w-3.5 h-3.5" /> Passwords do not match
                      </span>
                    )
                  )}
                </div>
              )}

              <div className="flex justify-end pt-3">
                <button
                  type="submit"
                  disabled={isChangingPass || !currentPassword || !newPassword || newPassword !== confirmPassword}
                  className="rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 px-6 py-3 text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-xl disabled:opacity-50 flex items-center gap-2"
                >
                  {isChangingPass ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: CRM Context & System Explanation (4 cols) */}
        <div className="lg:col-span-4 space-y-6">
          {/* Workspace & Role Overview */}
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-[2rem] p-6 shadow-sm space-y-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-[#012169] dark:text-blue-400 italic">
              Account Metadata
            </h3>

            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800/80">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">
                  System Role
                </p>
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-900/40 text-[#012169] dark:text-blue-300">
                    {user.role}
                  </span>
                  <span className="text-xs text-zinc-500 font-medium">
                    {user.role === "ADMIN" ? "Full system access" : "Standard member"}
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800/80">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">
                  Organization
                </p>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#012169] dark:text-blue-400" />
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {user.organizationName || "Personal Workspace"}
                  </p>
                </div>
                {user.organizationPlan && (
                  <span className="mt-2 inline-block text-[9px] font-black uppercase tracking-widest text-zinc-500 bg-zinc-200/60 dark:bg-zinc-800 px-2 py-0.5 rounded">
                    {user.organizationPlan} Plan
                  </span>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800/80">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">
                  Account Status
                </p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
                    {user.status || "ACTIVE"}
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800/80">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-1">
                  Member Since
                </p>
                <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400 text-xs font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  {new Date(user.createdAt).toLocaleDateString(undefined, {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* How Profile connects across the CRM */}
          <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/30 dark:from-blue-950/20 dark:to-zinc-900 border border-blue-100 dark:border-blue-900/30 rounded-[2rem] p-6 space-y-4">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-[#012169] dark:text-blue-300">
              <Sparkles className="w-4 h-4 text-amber-500" />
              How Profile Info Is Used
            </div>
            <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-2.5 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-[#012169] dark:text-blue-400 font-bold">•</span>
                <span><strong>Meeting Invites:</strong> Your name and email appear as the host when leads schedule calls through your public forms.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#012169] dark:text-blue-400 font-bold">•</span>
                <span><strong>Email Campaigns:</strong> Acts as the default sender profile and reply-to address for personalized outreach.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[#012169] dark:text-blue-400 font-bold">•</span>
                <span><strong>Task Assignments:</strong> Associates pipeline deals, follow-up tasks, and activity logs to your identity.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
