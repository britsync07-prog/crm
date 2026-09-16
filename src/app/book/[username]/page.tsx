"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Clock, Video, Phone, MapPin, ChevronRight, Loader2, AlertCircle } from "lucide-react";

interface HostInfo {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  timeZone: string;
  bookingSlug: string;
}

interface EventType {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  duration: number;
  color: string;
  locationType: string;
}

export default function PublicHostPage() {
  const params = useParams();
  const username = params.username as string;
  const router = useRouter();

  const [host, setHost] = useState<HostInfo | null>(null);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!username) return;

    const fetchHost = async () => {
      try {
        const res = await fetch(`/api/book/${username}`);
        if (res.ok) {
          const data = await res.json();
          setHost(data.host);
          setEventTypes(data.eventTypes || []);
          if (typeof document !== "undefined" && data.host?.name) {
            document.title = `${data.host.name} - Scheduling`;
          }
        } else {
          setError("Host not found or this link is inactive");
        }
      } catch {
        setError("Unable to load scheduling page");
      } finally {
        setLoading(false);
      }
    };

    fetchHost();
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#006bff]" />
      </div>
    );
  }

  if (error || !host) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-sm">
          <AlertCircle className="w-12 h-12 text-slate-300 mx-auto" />
          <h2 className="text-lg font-bold text-slate-900">Page Not Found</h2>
          <p className="text-xs text-slate-500">{error || "This booking link does not exist."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50/70 py-12 px-4 flex flex-col items-center">
      <div className="max-w-2xl w-full space-y-6">
        {/* Host Header Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-3 shadow-sm">
          <div className="w-20 h-20 rounded-full bg-[#006bff]/10 border-2 border-[#006bff]/20 text-[#006bff] flex items-center justify-center font-black text-2xl mx-auto overflow-hidden">
            {host.image ? (
              <img src={host.image} alt={host.name} className="w-full h-full object-cover" />
            ) : (
              <span>{host.name[0]?.toUpperCase() || "H"}</span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900">{host.name}</h1>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Welcome to my scheduling page. Please choose an event to book time on my calendar.
          </p>
        </div>

        {/* Event Types List */}
        <div className="space-y-3">
          {eventTypes.map((event) => (
            <Link
              key={event.id}
              href={`/book/${username}/${event.slug}`}
              className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm hover:shadow-md hover:border-[#006bff] transition-all flex items-center justify-between gap-4 group block overflow-hidden relative"
            >
              <div
                className="absolute left-0 top-0 bottom-0 w-1.5"
                style={{ backgroundColor: event.color || "#006bff" }}
              />

              <div className="space-y-1.5 pl-2">
                <h3 className="font-bold text-slate-900 text-base group-hover:text-[#006bff] transition-colors">
                  {event.title}
                </h3>
                <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{event.duration} min</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    {event.locationType === "VIDEO" ? (
                      <>
                        <Video className="w-3.5 h-3.5 text-[#006bff]" />
                        <span>Video call</span>
                      </>
                    ) : event.locationType === "PHONE" ? (
                      <>
                        <Phone className="w-3.5 h-3.5 text-green-600" />
                        <span>Phone call</span>
                      </>
                    ) : (
                      <>
                        <MapPin className="w-3.5 h-3.5 text-amber-600" />
                        <span>In-person</span>
                      </>
                    )}
                  </span>
                </div>
                {event.description && (
                  <p className="text-xs text-slate-500 line-clamp-1">{event.description}</p>
                )}
              </div>

              <div className="w-8 h-8 rounded-full bg-slate-100 group-hover:bg-[#006bff] text-slate-400 group-hover:text-white flex items-center justify-center transition-colors shrink-0">
                <ChevronRight className="w-4 h-4" />
              </div>
            </Link>
          ))}

          {eventTypes.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 text-xs">
              No active event types currently available.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center pt-4">
          <p className="text-[11px] text-slate-400 font-medium">
            Powered by Calendly CRM Scheduling
          </p>
        </div>
      </div>
    </div>
  );
}
