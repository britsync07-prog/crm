"use client";

import { useEffect, useState, use } from "react";
import { Loader2, CheckCircle2, AlertCircle, FileText, Send } from "lucide-react";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

interface Field {
  id: string;
  label: string;
  type: string;
  required: boolean;
  options: string[];
}

interface Form {
  id: string;
  title: string;
  description: string | null;
  meetingSchedulingEnabled: boolean;
  meetingDurationMin: number;
  fields: Field[];
}

interface AvailabilityResponse {
  slots: { start: string; end: string; label: string }[];
  durationMin: number;
}

export default function PublicFormPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [form, setForm] = useState<Form | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submittedMeetingUrl, setSubmittedMeetingUrl] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<string, unknown>>({});
  const [error, setError] = useState<string | null>(null);
  const [bookMeeting, setBookMeeting] = useState(false);
  const [meetingEmail, setMeetingEmail] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState<AvailabilityResponse["slots"]>([]);
  const [slotLoading, setSlotLoading] = useState(false);
  const [selectedSlotStart, setSelectedSlotStart] = useState<string | null>(null);

  useEffect(() => {
    const fetchForm = async () => {
      try {
        const res = await fetch(`/api/forms/public/${id}`);
        if (res.ok) {
          setForm(await res.json());
        } else {
          setError("Form not found or has been closed.");
        }
      } catch (e) {
        setError("Failed to load form. Check your connection.");
      } finally {
        setLoading(false);
      }
    };
    fetchForm();
  }, [id]);

  useEffect(() => {
    const fetchAvailability = async () => {
      if (!form?.meetingSchedulingEnabled || !bookMeeting || !selectedDate) {
        setSlots([]);
        return;
      }
      setSlotLoading(true);
      try {
        const res = await fetch(`/api/forms/public/${id}/availability?date=${selectedDate}`);
        if (res.ok) {
          const data = (await res.json()) as AvailabilityResponse;
          setSlots(data.slots || []);
          if (!data.slots.find((s) => s.start === selectedSlotStart)) {
            setSelectedSlotStart(null);
          }
        }
      } catch {
        setSlots([]);
      } finally {
        setSlotLoading(false);
      }
    };

    fetchAvailability();
  }, [form?.meetingSchedulingEnabled, bookMeeting, id, selectedDate, selectedSlotStart]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (form?.meetingSchedulingEnabled && bookMeeting) {
      if (!meetingEmail.trim()) {
        toast.error("Email is required to book a meeting");
        return;
      }
      if (!selectedSlotStart) {
        toast.error("Please select a meeting slot");
        return;
      }
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/forms/public/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responses,
          meeting: form?.meetingSchedulingEnabled
            ? {
                book: bookMeeting,
                email: meetingEmail,
                slotStart: selectedSlotStart,
              }
            : undefined,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSubmittedMeetingUrl(data?.meeting?.meetingUrl || null);
        setSubmitted(true);
        toast.success("Form submitted successfully!");
      } else {
        const data = await res.json();
        toast.error(data.error || "Submission failed");
      }
    } catch (e) {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (fieldId: string, value: unknown) => {
    setResponses(prev => ({ ...prev, [fieldId]: value }));
  };

  const canSubmitMeeting = !form?.meetingSchedulingEnabled
    || !bookMeeting
    || (meetingEmail.trim().length > 0 && !!selectedSlotStart);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top_right,rgba(1,33,105,0.10),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(200,16,46,0.10),transparent_42%),#f7f9ff] dark:bg-slate-950">
        <Loader2 className="w-10 h-10 animate-spin text-[#012169]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[radial-gradient(circle_at_top_right,rgba(1,33,105,0.10),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(200,16,46,0.10),transparent_42%),#f7f9ff] dark:bg-slate-950 p-6 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-black uppercase italic dark:text-white">Error</h1>
        <p className="text-zinc-500 mt-2">{error}</p>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[radial-gradient(circle_at_top_right,rgba(1,33,105,0.10),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(200,16,46,0.10),transparent_42%),#f7f9ff] dark:bg-slate-950 p-6 text-center">
        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
        </div>
        <h1 className="text-4xl font-black dark:text-white tracking-tight italic uppercase">Thank You!</h1>
        <p className="text-zinc-500 mt-4 max-w-sm font-medium">Your response has been recorded successfully.</p>
        {submittedMeetingUrl && (
          <a
            href={submittedMeetingUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-6 inline-flex px-5 py-3 rounded-xl bg-[#012169] text-white text-xs font-black uppercase tracking-widest hover:bg-[#c8102e] transition-colors"
          >
            Open Meeting Link
          </a>
        )}
        <button 
           onClick={() => window.location.reload()}
           className="mt-8 px-6 py-2 border border-blue-100 dark:border-blue-900/30 rounded-full text-xs font-black uppercase tracking-widest hover:bg-blue-50 dark:hover:bg-blue-950/20 transition-colors"
        >
          Submit another response
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(1,33,105,0.10),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(200,16,46,0.10),transparent_42%),#f7f9ff] dark:bg-slate-950 py-12 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Header Card */}
          <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] border-t-8 border-[#012169] shadow-2xl p-8 sm:p-12 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-5">
               <FileText className="w-32 h-32" />
            </div>
            <h1 className="text-4xl sm:text-5xl font-black text-zinc-900 dark:text-zinc-50 tracking-tighter mb-4 leading-tight">
              {form?.title}
            </h1>
            {form?.description && (
              <p className="text-lg text-zinc-500 dark:text-zinc-400 font-medium whitespace-pre-wrap">
                {form.description}
              </p>
            )}
          </div>

          {/* Dynamic Fields */}
          {form?.fields.map((field) => (
            <div key={field.id} className="bg-white dark:bg-slate-950 rounded-3xl border border-blue-100 dark:border-blue-900/30 p-8 shadow-xl">
              <label className="block text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-4">
                {field.label} {field.required && <span className="text-red-500">*</span>}
              </label>

              {field.type === "TEXT" && (
                <input
                  required={field.required}
                  placeholder="Your answer"
                  onChange={e => handleInputChange(field.id, e.target.value)}
                  className="w-full bg-blue-50/40 dark:bg-blue-950/20 border-b-2 border-blue-100 dark:border-blue-900/30 focus:border-[#012169] rounded-xl px-4 py-3 outline-none transition-all"
                />
              )}

              {field.type === "TEXTAREA" && (
                <textarea
                  required={field.required}
                  placeholder="Your answer"
                  onChange={e => handleInputChange(field.id, e.target.value)}
                  className="w-full bg-blue-50/40 dark:bg-blue-950/20 border-b-2 border-blue-100 dark:border-blue-900/30 focus:border-[#012169] rounded-xl px-4 py-3 outline-none transition-all h-32 resize-none"
                />
              )}

              {field.type === "DROPDOWN" && (
                <select
                  required={field.required}
                  onChange={e => handleInputChange(field.id, e.target.value)}
                  className="w-full bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#012169] appearance-none font-medium"
                >
                  <option value="">Choose an option</option>
                  {field.options.map((opt, idx) => <option key={`${opt}-${idx}`} value={opt}>{opt}</option>)}
                </select>
              )}

              {field.type === "RADIO" && (
                <div className="space-y-3">
                  {field.options.map((opt, idx) => (
                    <label key={`${opt}-${idx}`} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="radio"
                        name={field.id}
                        required={field.required}
                        value={opt}
                        onChange={e => handleInputChange(field.id, e.target.value)}
                        className="w-5 h-5 text-[#012169] border-zinc-300 focus:ring-[#012169]"
                      />
                      <span className="text-zinc-700 dark:text-zinc-300 group-hover:text-[#012169] transition-colors">{opt}</span>
                    </label>
                  ))}
                </div>
              )}

              {field.type === "CHECKBOX" && (
                <div className="space-y-3">
                  {field.options.map((opt, idx) => (
                    <label key={`${opt}-${idx}`} className="flex items-center gap-3 cursor-pointer group">
                      <input
                        type="checkbox"
                        value={opt}
                        onChange={e => {
                          const raw = responses[field.id];
                          const current = Array.isArray(raw) ? raw.filter((v): v is string => typeof v === "string") : [];
                          const next = e.target.checked 
                            ? [...current, opt] 
                            : current.filter((i: string) => i !== opt);
                          handleInputChange(field.id, next);
                        }}
                        className="w-5 h-5 rounded text-[#012169] border-zinc-300 focus:ring-[#012169]"
                      />
                      <span className="text-zinc-700 dark:text-zinc-300 group-hover:text-[#012169] transition-colors">{opt}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}

          {form?.meetingSchedulingEnabled && (
            <div className="bg-white dark:bg-slate-950 rounded-3xl border border-blue-100 dark:border-blue-900/30 p-8 shadow-xl space-y-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-black uppercase italic tracking-tight text-zinc-900 dark:text-zinc-100">Book a 1 hour call</h3>
                  <p className="text-sm text-zinc-500">Optional meeting booking after form submit.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setBookMeeting((v) => !v)}
                  className={cn(
                    "px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                    bookMeeting ? "bg-[#012169] text-white" : "bg-blue-50 dark:bg-blue-950/20 text-zinc-500"
                  )}
                >
                  {bookMeeting ? "Booking On" : "Booking Off"}
                </button>
              </div>

              {bookMeeting && (
                <div className="space-y-4 pt-4 border-t border-blue-100 dark:border-blue-900/30">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">Your email *</label>
                    <input
                      type="email"
                      required={bookMeeting}
                      value={meetingEmail}
                      onChange={(e) => setMeetingEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#012169]"
                    />
                  </div>

                  <div className="grid sm:grid-cols-[220px_1fr] gap-4 items-start">
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">Date</label>
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        className="w-full bg-blue-50/40 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-[#012169]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">Available time slots</label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-auto pr-1">
                        {slotLoading && <p className="text-sm text-zinc-500">Loading slots...</p>}
                        {!slotLoading && slots.length === 0 && <p className="text-sm text-zinc-500">No free slots for this date.</p>}
                        {!slotLoading && slots.map((slot) => (
                          <button
                            key={slot.start}
                            type="button"
                            onClick={() => setSelectedSlotStart(slot.start)}
                            className={cn(
                              "px-3 py-2 rounded-lg border text-xs font-bold transition-all text-left",
                              selectedSlotStart === slot.start
                                ? "bg-[#012169] text-white border-[#012169]"
                                : "bg-blue-50/40 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30 hover:border-[#012169]"
                            )}
                          >
                            {slot.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-between items-center bg-white/50 dark:bg-white/5 p-8 rounded-3xl border-2 border-dashed border-blue-100 dark:border-blue-900/30">
            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Never submit passwords through forms.</p>
            <button
               type="submit"
               disabled={submitting || !canSubmitMeeting}
               className="bg-[#012169] hover:bg-[#c8102e] disabled:opacity-50 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center gap-3 shadow-2xl shadow-blue-900/20 active:scale-95 transition-all"
            >
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              Submit Form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
