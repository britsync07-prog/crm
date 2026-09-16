"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, X, Loader2, User, Tag, Briefcase, Globe } from "lucide-react";
import { toast } from "react-hot-toast";
import { updateLead } from "@/app/actions";
import { LEAD_STAGES } from "@/lib/crm-lifecycle";

interface LeadData {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  source?: string | null;
  status: string;
  categoryId?: string | null;
  licenseType?: string | null;
  areaOfOperation?: string | null;
  dealFocus?: string | null;
  budgetRange?: string | null;
  website?: string | null;
  address?: string | null;
  linkedin?: string | null;
}

interface EditLeadModalProps {
  lead: LeadData;
  categories: Array<{ id: string; name: string }>;
  variant?: "header" | "card";
}

export default function EditLeadModal({ lead, categories, variant = "header" }: EditLeadModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // Form states initialized with lead data
  const [name, setName] = useState(lead.name);
  const [email, setEmail] = useState(lead.email);
  const [phone, setPhone] = useState(lead.phone || "");
  const [company, setCompany] = useState(lead.company || "");
  const [source, setSource] = useState(lead.source || "");
  const [status, setStatus] = useState(lead.status || "New");
  const [categoryId, setCategoryId] = useState(lead.categoryId || "");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showNewCatInput, setShowNewCatInput] = useState(false);
  const [licenseType, setLicenseType] = useState(lead.licenseType || "");
  const [areaOfOperation, setAreaOfOperation] = useState(lead.areaOfOperation || "");
  const [dealFocus, setDealFocus] = useState(lead.dealFocus || "");
  const [budgetRange, setBudgetRange] = useState(lead.budgetRange || "");
  const [website, setWebsite] = useState(lead.website || "");
  const [address, setAddress] = useState(lead.address || "");
  const [linkedin, setLinkedin] = useState(lead.linkedin || "");

  const handleOpen = () => {
    setName(lead.name);
    setEmail(lead.email);
    setPhone(lead.phone || "");
    setCompany(lead.company || "");
    setSource(lead.source || "");
    setStatus(lead.status || "New");
    setCategoryId(lead.categoryId || "");
    setNewCategoryName("");
    setShowNewCatInput(false);
    setLicenseType(lead.licenseType || "");
    setAreaOfOperation(lead.areaOfOperation || "");
    setDealFocus(lead.dealFocus || "");
    setBudgetRange(lead.budgetRange || "");
    setWebsite(lead.website || "");
    setAddress(lead.address || "");
    setLinkedin(lead.linkedin || "");
    setIsOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!email.trim()) {
      toast.error("Email is required");
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("leadId", lead.id);
        formData.set("name", name.trim());
        formData.set("email", email.trim().toLowerCase());
        formData.set("phone", phone.trim());
        formData.set("company", company.trim());
        formData.set("source", source.trim());
        formData.set("status", status);
        formData.set("categoryId", categoryId);
        if (showNewCatInput && newCategoryName.trim()) {
          formData.set("newCategoryName", newCategoryName.trim());
        }
        formData.set("licenseType", licenseType.trim());
        formData.set("areaOfOperation", areaOfOperation.trim());
        formData.set("dealFocus", dealFocus.trim());
        formData.set("budgetRange", budgetRange.trim());
        formData.set("website", website.trim());
        formData.set("address", address.trim());
        formData.set("linkedin", linkedin.trim());

        const res = await updateLead(formData);
        if (res?.success) {
          toast.success("Lead profile updated successfully");
          setIsOpen(false);
          router.refresh();
        } else {
          toast.error(res?.error || "Failed to update lead");
        }
      } catch (err: any) {
        toast.error(err?.message || "An unexpected error occurred");
      }
    });
  };

  return (
    <>
      {variant === "header" ? (
        <button
          type="button"
          onClick={handleOpen}
          className="rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-zinc-900 px-5 py-3 text-xs font-black uppercase tracking-widest text-zinc-800 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all flex items-center gap-2 shadow-sm active:scale-95"
        >
          <Pencil className="w-3.5 h-3.5 text-[#012169] dark:text-blue-400" />
          <span>Edit Lead</span>
        </button>
      ) : (
        <button
          type="button"
          onClick={handleOpen}
          className="px-2.5 py-1 hover:bg-zinc-100 dark:hover:bg-white/10 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider active:scale-95"
          title="Edit Lead Details"
        >
          <Pencil className="w-3 h-3 text-[#012169] dark:text-blue-400" />
          <span>Edit</span>
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 sm:px-8 py-5 border-b border-zinc-100 dark:border-white/10 shrink-0">
              <div>
                <h2 className="text-xl font-black uppercase italic tracking-tight text-zinc-900 dark:text-zinc-50">
                  Edit Lead Profile
                </h2>
                <p className="text-xs text-zinc-400 font-medium">
                  Update contact information, pipeline status, and entity metadata.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body - Scrollable */}
            <form id="edit-lead-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6">
              {/* Section 1: Contact Details */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-zinc-100 dark:border-white/5">
                  <User className="w-4 h-4 text-[#012169] dark:text-blue-400" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                    Contact Information
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1.5 block">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 px-4 py-2.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#012169] focus:ring-1 focus:ring-[#012169]"
                      placeholder="e.g. John Smith"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1.5 block">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 px-4 py-2.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#012169] focus:ring-1 focus:ring-[#012169]"
                      placeholder="e.g. john@example.com"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1.5 block">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 px-4 py-2.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#012169] focus:ring-1 focus:ring-[#012169]"
                      placeholder="e.g. +1 555 123 4567"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1.5 block">
                      Company
                    </label>
                    <input
                      type="text"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 px-4 py-2.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#012169] focus:ring-1 focus:ring-[#012169]"
                      placeholder="e.g. Acme Corp"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Pipeline & Classification */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-zinc-100 dark:border-white/5">
                  <Tag className="w-4 h-4 text-[#012169] dark:text-blue-400" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                    Pipeline & Sector
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1.5 block">
                      Pipeline Stage / Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 px-4 py-2.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#012169] focus:ring-1 focus:ring-[#012169] uppercase"
                    >
                      {Object.values(LEAD_STAGES).map((st) => (
                        <option key={st} value={st} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                          {st.toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 block">
                        Sector / Category
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowNewCatInput(!showNewCatInput)}
                        className="text-[9px] font-black uppercase tracking-wider text-[#012169] dark:text-blue-400 hover:underline"
                      >
                        {showNewCatInput ? "Use Existing" : "+ New Sector"}
                      </button>
                    </div>
                    {showNewCatInput ? (
                      <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        placeholder="Enter new sector name..."
                        className="w-full rounded-xl border border-blue-300 dark:border-blue-700 bg-zinc-50 dark:bg-white/5 px-4 py-2.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#012169] focus:ring-1 focus:ring-[#012169]"
                      />
                    ) : (
                      <select
                        value={categoryId}
                        onChange={(e) => setCategoryId(e.target.value)}
                        className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 px-4 py-2.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#012169] focus:ring-1 focus:ring-[#012169]"
                      >
                        <option value="" className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                          No Sector / Uncategorized
                        </option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id} className="bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100">
                            {cat.name}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1.5 block">
                      Lead Source
                    </label>
                    <input
                      type="text"
                      value={source}
                      onChange={(e) => setSource(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 px-4 py-2.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#012169] focus:ring-1 focus:ring-[#012169]"
                      placeholder="e.g. Website, Outreach, Form, Referral"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1.5 block">
                      License / Industry
                    </label>
                    <input
                      type="text"
                      value={licenseType}
                      onChange={(e) => setLicenseType(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 px-4 py-2.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#012169] focus:ring-1 focus:ring-[#012169]"
                      placeholder="e.g. Fintech, SaaS, Healthcare"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Operations & Budget */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-zinc-100 dark:border-white/5">
                  <Briefcase className="w-4 h-4 text-[#012169] dark:text-blue-400" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                    Deal Details & Scope
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1.5 block">
                      Deal Focus
                    </label>
                    <input
                      type="text"
                      value={dealFocus}
                      onChange={(e) => setDealFocus(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 px-4 py-2.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#012169] focus:ring-1 focus:ring-[#012169]"
                      placeholder="e.g. Enterprise License, Annual Contract"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1.5 block">
                      Budget Range
                    </label>
                    <input
                      type="text"
                      value={budgetRange}
                      onChange={(e) => setBudgetRange(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 px-4 py-2.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#012169] focus:ring-1 focus:ring-[#012169]"
                      placeholder="e.g. $10,000 - $50,000"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1.5 block">
                      Area of Operation
                    </label>
                    <input
                      type="text"
                      value={areaOfOperation}
                      onChange={(e) => setAreaOfOperation(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 px-4 py-2.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#012169] focus:ring-1 focus:ring-[#012169]"
                      placeholder="e.g. North America, EMEA, Global"
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Online Presence & Address */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-1 border-b border-zinc-100 dark:border-white/5">
                  <Globe className="w-4 h-4 text-[#012169] dark:text-blue-400" />
                  <span className="text-[11px] font-black uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
                    Online & Physical Presence
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1.5 block">
                      Website URL
                    </label>
                    <input
                      type="text"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 px-4 py-2.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#012169] focus:ring-1 focus:ring-[#012169]"
                      placeholder="https://example.com"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1.5 block">
                      LinkedIn URL
                    </label>
                    <input
                      type="text"
                      value={linkedin}
                      onChange={(e) => setLinkedin(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 px-4 py-2.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#012169] focus:ring-1 focus:ring-[#012169]"
                      placeholder="https://linkedin.com/in/..."
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-1.5 block">
                      Address / Location
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full rounded-xl border border-zinc-200 dark:border-white/10 bg-zinc-50 dark:bg-white/5 px-4 py-2.5 text-xs font-bold text-zinc-900 dark:text-zinc-100 outline-none focus:border-[#012169] focus:ring-1 focus:ring-[#012169]"
                      placeholder="e.g. 100 Main St, New York, NY 10001"
                    />
                  </div>
                </div>
              </div>
            </form>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 px-6 sm:px-8 py-5 border-t border-zinc-100 dark:border-white/10 bg-zinc-50/50 dark:bg-zinc-900/40 shrink-0">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                disabled={isPending}
                className="px-5 py-2.5 rounded-xl border border-zinc-200 dark:border-white/10 text-xs font-black uppercase tracking-wider text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="edit-lead-form"
                disabled={isPending}
                className="px-6 py-2.5 rounded-xl bg-[#012169] text-xs font-black uppercase tracking-widest text-white hover:bg-blue-900 transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 flex items-center gap-2"
              >
                {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>{isPending ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
