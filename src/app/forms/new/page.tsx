"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  FileText, 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Settings2, 
  Save, 
  Type, 
  AlignLeft, 
  List, 
  CheckSquare, 
  CircleDot,
  Loader2,
  X,
  Sparkles,
  Zap,
  ArrowRight,
  GripHorizontal
} from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

interface Field {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options: string[];
}

const FIELD_TYPES = [
  { type: "TEXT", label: "Short Answer", icon: Type },
  { type: "TEXTAREA", label: "Long Answer", icon: AlignLeft },
  { type: "DROPDOWN", label: "Dropdown", icon: List },
  { type: "RADIO", label: "Multi Choice", icon: CircleDot },
  { type: "CHECKBOX", label: "Checkboxes", icon: CheckSquare },
];

export default function NewFormPage() {
  const router = useRouter();
  const [title, setTitle] = useState("Untitled Gateway");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<Field[]>([]);
  const [saving, setSaving] = useState(false);
  const [meetingSchedulingEnabled, setMeetingSchedulingEnabled] = useState(false);
  const [meetingDurationMin, setMeetingDurationMin] = useState(60);

  const addField = (type: string) => {
    const newField: Field = {
      id: Math.random().toString(36).substr(2, 9),
      label: "INITIALIZING QUESTION...",
      type,
      required: false,
      options: type === "DROPDOWN" || type === "RADIO" || type === "CHECKBOX" ? ["Default Option"] : [],
    };
    setFields([...fields, newField]);
    toast.success("Module Integrated", { duration: 1000 });
  };

  const updateField = (id: string, updates: Partial<Field>) => {
    setFields(fields.map(f => f.id === id ? { ...f, ...updates } : f));
  };

  const removeField = (id: string) => {
    setFields(fields.filter(f => f.id !== id));
  };

  const moveField = (index: number, direction: "up" | "down") => {
    const newFields = [...fields];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newFields.length) return;
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    setFields(newFields);
  };

  const handleSave = async () => {
    if (!title.trim()) return toast.error("TITLE PROTOCOL MISSING");
    if (fields.length === 0) return toast.error("MINIMUM 1 MODULE REQUIRED");

    setSaving(true);
    try {
      const res = await fetch("/api/forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          fields,
          meetingSchedulingEnabled,
          meetingDurationMin,
        }),
      });

      if (res.ok) {
        toast.success("Protocol Published Sucessfully");
        router.push("/forms");
      } else {
        const error = await res.json();
        toast.error(error.error || "Uplink Failed");
      }
    } catch (e) {
      toast.error("Network synchronization error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] dark:bg-black font-sans text-zinc-900 dark:text-zinc-100 pb-40">
      {/* Premium Header - Fully Responsive */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-2xl border-b-[4px] border-zinc-100 dark:border-zinc-900 px-4 sm:px-10 py-5 sm:py-8 flex items-center justify-between">
        <div className="flex items-center gap-4 sm:gap-8">
          <button onClick={() => router.back()} className="w-10 h-10 sm:w-12 sm:h-12 bg-zinc-50 dark:bg-zinc-900 rounded-xl flex items-center justify-center hover:bg-zinc-900 hover:text-white dark:hover:bg-white dark:hover:text-black transition-all">
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[#012169] rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div className="hidden xs:block">
               <span className="font-black italic uppercase tracking-[0.2em] text-xs sm:text-sm leading-none block">Architect</span>
               <span className="text-[8px] font-black text-zinc-400 uppercase tracking-widest mt-1 hidden sm:block">Building v4.02</span>
            </div>
          </div>
        </div>

        <button 
          onClick={handleSave} 
          disabled={saving}
          className="px-6 sm:px-10 py-3 sm:py-4 bg-zinc-900 dark:bg-white text-white dark:text-black font-black uppercase tracking-[0.2em] sm:tracking-[0.4em] text-[9px] sm:text-[11px] rounded-xl sm:rounded-2xl transition-all hover:bg-[#012169] dark:hover:bg-[#012169] dark:hover:text-white hover:shadow-2xl hover:shadow-blue-500/30 flex items-center gap-3 sm:gap-5 group disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 group-hover:rotate-12 transition-transform" />}
          <span className="hidden sm:inline">Publish Protocol</span>
          <span className="sm:hidden">Publish</span>
        </button>
      </header>

      <main className="max-w-4xl mx-auto py-12 sm:py-24 px-4 sm:px-10">
        {/* Form Identity Section */}
        <div className="bg-white dark:bg-zinc-950 rounded-[2.5rem] sm:rounded-[3.5rem] border-[4px] border-white dark:border-zinc-900 shadow-2xl p-8 sm:p-14 mb-10 sm:mb-16 shelf-shadow relative overflow-hidden group/id">
          <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover/id:scale-110 transition-transform duration-1000">
             <Sparkles className="w-32 h-32" />
          </div>
          <input 
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-transparent text-3xl sm:text-6xl font-black italic tracking-tighter uppercase outline-none placeholder-zinc-100 dark:placeholder-zinc-800 border-none px-0 mb-6"
            placeholder="PROTOCOL TITLE"
          />
          <textarea 
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="w-full bg-transparent text-sm sm:text-xl font-bold italic outline-none placeholder-zinc-100 dark:placeholder-zinc-900 border-none px-0 resize-none h-20 sm:h-32 custom-scrollbar"
            placeholder="ELABORATE OBJECTIVES (OPTIONAL)..."
          />
        </div>

        {/* Dynamic Modules (Fields) */}
        <div className="space-y-8 sm:space-y-12">
          {fields.map((field, index) => (
            <div key={field.id} className="group relative bg-white dark:bg-zinc-950 rounded-[2rem] sm:rounded-[3rem] border border-zinc-100 dark:border-zinc-900 p-8 sm:p-12 shadow-xl transition-all hover:border-[#012169] hover:shadow-2xl hover:-translate-y-1">
              {/* Module Controls - Fully Responsive */}
              <div className="absolute top-4 right-4 sm:top-8 sm:right-8 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all bg-white dark:bg-zinc-900 p-1 rounded-xl sm:rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-lg">
                <button onClick={() => moveField(index, "up")} className="p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg sm:rounded-xl transition-all"><ChevronUp className="w-4 h-4" /></button>
                <button onClick={() => moveField(index, "down")} className="p-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg sm:rounded-xl transition-all"><ChevronDown className="w-4 h-4" /></button>
                <div className="w-px h-6 bg-zinc-100 dark:bg-zinc-800 mx-1 sm:mx-2" />
                <button onClick={() => removeField(field.id)} className="p-3 text-zinc-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg sm:rounded-xl transition-all"><Trash2 className="w-4 h-4" /></button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-14 pt-8 sm:pt-0">
                <div className="lg:col-span-8 space-y-8">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Module Question</label>
                    <input 
                      value={field.label}
                      onChange={e => updateField(field.id, { label: e.target.value })}
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border-2 border-transparent focus:border-blue-600 rounded-2xl px-6 py-4 text-sm sm:text-lg font-black uppercase italic tracking-tight outline-none transition-all"
                      placeholder="ENTER QUESTION PROTOCOL..."
                    />
                  </div>
                  
                  {/* Field Specific Content - Optimized for Touch */}
                  {(field.type === "DROPDOWN" || field.type === "RADIO" || field.type === "CHECKBOX") && (
                    <div className="space-y-4 pt-4 border-t border-zinc-50 dark:border-zinc-900">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Selection Parameters</label>
                      {field.options.map((option, idx) => (
                        <div key={idx} className="flex items-center gap-4 group/opt">
                          <div className="w-6 h-6 rounded-full bg-zinc-100 dark:bg-zinc-900 flex-shrink-0 flex items-center justify-center shadow-inner">
                            <div className="w-2 h-2 rounded-full bg-[#012169] opacity-20 group-hover/opt:opacity-100 transition-opacity" />
                          </div>
                          <input 
                            value={option}
                            onChange={e => {
                              const newOpts = [...field.options];
                              newOpts[idx] = e.target.value;
                              updateField(field.id, { options: newOpts });
                            }}
                            className="flex-1 bg-transparent border-b-2 border-zinc-50 dark:border-zinc-900 py-3 text-sm font-bold outline-none focus:border-blue-600 transition-all uppercase tracking-tight"
                          />
                          <button 
                            onClick={() => {
                              const newOpts = field.options.filter((_, i) => i !== idx);
                              updateField(field.id, { options: newOpts });
                            }}
                            className="p-3 text-zinc-200 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button 
                        onClick={() => updateField(field.id, { options: [...field.options, "NEW OPTION"] })}
                        className="flex items-center gap-3 px-6 py-3 rounded-xl bg-zinc-50 dark:bg-zinc-900 border-2 border-transparent hover:border-[#012169] hover:text-[#012169] text-[10px] font-black uppercase tracking-widest transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" /> Integrate Option
                      </button>
                    </div>
                  )}

                  {field.type === "TEXT" && <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border-2 border-dashed border-zinc-100 dark:border-zinc-800 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300">Awaiting short response input...</div>}
                  {field.type === "TEXTAREA" && <div className="p-10 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border-2 border-dashed border-zinc-100 dark:border-zinc-800 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300">Awaiting multi-line data stream...</div>}
                </div>

                <div className="lg:col-span-4 space-y-8 lg:border-l lg:border-zinc-50 lg:dark:border-zinc-900 lg:pl-10">
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 ml-1">Module Logic</label>
                    <div className="relative group">
                       <select 
                         value={field.type}
                         onChange={e => updateField(field.id, { type: e.target.value, options: (e.target.value === 'DROPDOWN' || e.target.value === 'RADIO' || e.target.value === 'CHECKBOX') ? ['INITIAL OPTION'] : [] })}
                         className="w-full bg-zinc-50 dark:bg-zinc-900 border-2 border-transparent focus:border-blue-600 rounded-2xl px-6 py-4 text-xs font-black uppercase tracking-widest appearance-none cursor-pointer outline-none transition-all"
                       >
                         {FIELD_TYPES.map(t => <option key={t.type} value={t.type}>{t.label.toUpperCase()}</option>)}
                       </select>
                       <Zap className="absolute right-5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-300 pointer-events-none group-focus-within:text-[#012169] transition-colors" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-zinc-50 dark:bg-zinc-900 p-5 rounded-2xl border-2 border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-all cursor-pointer group/req" onClick={() => updateField(field.id, { required: !field.required })}>
                    <div className="flex items-center gap-3">
                      <div className={cn("w-5 h-5 rounded-md border-2 transition-all flex items-center justify-center", field.required ? "bg-[#012169] border-blue-600 shadow-lg shadow-blue-600/30" : "border-zinc-200 dark:border-zinc-800")}>
                        {field.required && <Plus className="w-3.5 h-3.5 text-white rotate-45" />}
                      </div>
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest group-hover/req:text-[#012169] transition-colors">Mandatory Field</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Meeting Booking Settings */}
        <div className="mt-16 rounded-[2rem] sm:rounded-[3rem] border border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950 p-8 sm:p-10 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5">
            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Scheduling Option</p>
              <h3 className="text-xl sm:text-2xl font-black uppercase italic tracking-tight">Allow Meeting Booking</h3>
              <p className="text-sm text-zinc-500 font-medium">
                Show Calendly-style 1 hour call booking after form submission.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMeetingSchedulingEnabled((v) => !v)}
              className={cn(
                "px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                meetingSchedulingEnabled
                  ? "bg-[#012169] text-white shadow-xl shadow-blue-900/20"
                  : "bg-zinc-100 dark:bg-zinc-900 text-zinc-500"
              )}
            >
              {meetingSchedulingEnabled ? "Enabled" : "Disabled"}
            </button>
          </div>

          {meetingSchedulingEnabled && (
            <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-900">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Meeting Duration (minutes)</label>
              <select
                value={meetingDurationMin}
                onChange={(e) => setMeetingDurationMin(Number(e.target.value))}
                className="mt-3 w-full sm:w-56 bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl px-5 py-3 text-sm font-bold focus:border-blue-600 outline-none transition-all"
              >
                <option value={60}>60</option>
              </select>
              <p className="mt-3 text-[11px] text-zinc-500 font-medium">
                Submitter must provide email to book. Meeting is added as locked event in your calendar.
              </p>
            </div>
          )}
        </div>

        {/* Improved Add Module Navigation - Global Responsive Fixed */}
        <div className="mt-20 scroll-mt-32" id="modules">
           <div className="flex items-center gap-3 mb-8">
              <Plus className="w-5 h-5 text-[#012169]" />
              <h3 className="text-xs font-black uppercase tracking-[0.3em] text-zinc-400">Integrate Module</h3>
           </div>
           <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {FIELD_TYPES.map((t) => (
                <button
                  key={t.type}
                  onClick={() => addField(t.type)}
                  className="flex flex-col items-center justify-center gap-4 p-8 bg-white dark:bg-zinc-950 rounded-[2rem] border-2 border-transparent hover:border-blue-600 hover:shadow-2xl transition-all group active:scale-95 group/mod"
                >
                  <div className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center group-hover/mod:bg-[#012169] group-hover/mod:text-white transition-all shadow-inner">
                    <t.icon className="w-5 h-5" />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-widest text-center group-hover/mod:text-[#012169]">{t.label}</span>
                </button>
              ))}
           </div>
        </div>
      </main>
    </div>
  );
}
