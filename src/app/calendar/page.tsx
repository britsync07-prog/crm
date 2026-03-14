"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Clock, 
  Settings2,
  Mail,
  Zap,
  Target,
  Sparkles,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  Trash2,
  MoreVertical,
  ChevronDown
} from "lucide-react";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addDays, startOfDay, addHours, differenceInHours, startOfHour, setHours, setMinutes, isSameWeek, isWithinInterval } from "date-fns";
import { toast } from "react-hot-toast";
import { cn } from "@/lib/utils";

// Types
interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start: Date;
  end: Date;
  userId: string;
  type: 'TASK' | 'MEETING' | 'REMINDER';
  isLocked?: boolean;
  source?: string;
  meetingId?: string | null;
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [viewMode, setViewMode] = useState<'MONTH' | 'WEEK' | 'DAY'>('WEEK');
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    startTime: "09:00",
    endTime: "10:00",
    type: "TASK" as const
  });
  
  // Drag and Drop / Resize State
  const [draggedEvent, setDraggedEvent] = useState<CalendarEvent | null>(null);
  const [resizingEvent, setResizingEvent] = useState<CalendarEvent | null>(null);
  const [resizeStartY, setResizeStartY] = useState(0);
  const [resizeStartHeight, setResizeStartHeight] = useState(0);

  // Mock initial setup check
  const [emailLinked, setEmailLinked] = useState(false);
  const [calendarSettings, setCalendarSettings] = useState({
    availableStart: "09:00",
    availableEnd: "17:00",
    timeZone: "UTC",
    reminderAccountId: ""
  });
  const [emailAccounts, setEmailAccounts] = useState<{id: string, email: string}[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventsRes, settingsRes, emailsRes] = await Promise.all([
          fetch("/api/calendar/events"),
          fetch("/api/calendar/settings"),
          fetch("/api/email-accounts")
        ]);

        if (eventsRes.ok) {
          const data = await eventsRes.json() as Array<Omit<CalendarEvent, "start" | "end"> & { start: string; end: string }>;
          setEvents(data.map((e) => ({
            ...e,
            start: new Date(e.start),
            end: new Date(e.end)
          })));
        }

        if (settingsRes.ok) {
          const settings = await settingsRes.json();
          setCalendarSettings(settings);
          if (settings.reminderAccountId) setEmailLinked(true);
        }

        if (emailsRes.ok) {
          const emails = await emailsRes.json();
          setEmailAccounts(emails);
        }
      } catch (error) {
        console.error("Failed to fetch calendar data", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const days = eachDayOfInterval({ start: startDate, end: endDate });

  const handleNext = () => {
    if (viewMode === 'MONTH') setCurrentDate(addMonths(currentDate, 1));
    else if (viewMode === 'WEEK') setCurrentDate(addDays(currentDate, 7));
    else setCurrentDate(addDays(currentDate, 1));
  };

  const handlePrev = () => {
    if (viewMode === 'MONTH') setCurrentDate(subMonths(currentDate, 1));
    else if (viewMode === 'WEEK') setCurrentDate(addDays(currentDate, -7));
    else setCurrentDate(addDays(currentDate, -1));
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;

    try {
      const start = new Date(selectedDate);
      const [sh, sm] = newEvent.startTime.split(":").map(Number);
      start.setHours(sh, sm);

      const end = new Date(selectedDate);
      const [eh, em] = newEvent.endTime.split(":").map(Number);
      end.setHours(eh, em);

      const response = await fetch("/api/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newEvent,
          start: start.toISOString(),
          end: end.toISOString()
        })
      });

      if (response.ok) {
        const created = await response.json();
        setEvents([...events, { ...created, start: new Date(created.start), end: new Date(created.end) }]);
        setIsTaskModalOpen(false);
        setNewEvent({ title: "", description: "", startTime: "09:00", endTime: "10:00", type: "TASK" });
        toast.success("Task Synchronized");
      }
    } catch (e) {
      toast.error("Sync Failed");
    }
  };

  const handleUpdateEvent = async (id: string, updates: Partial<CalendarEvent>) => {
    try {
      const response = await fetch(`/api/calendar/events/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start: updates.start?.toISOString(),
          end: updates.end?.toISOString()
        })
      });

      if (response.ok) {
        const updated = await response.json();
        setEvents(events.map(e => e.id === id ? { ...e, ...updated, start: new Date(updated.start), end: new Date(updated.end) } : e));
      }
    } catch (error) {
      toast.error("Correction Failed");
    }
  };

  const handleDeleteEvent = async (id: string) => {
    if (!confirm("Confirm temporal deletion?")) return;
    try {
      const response = await fetch(`/api/calendar/events/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        setEvents(events.filter(e => e.id !== id));
        toast.success("Timeline Purged");
      }
    } catch (error) {
      toast.error("Deletion Failed");
    }
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/calendar/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(calendarSettings)
      });
      if (response.ok) {
        toast.success("Logic Core Updated");
        setIsSettingsOpen(false);
        if (calendarSettings.reminderAccountId) setEmailLinked(true);
      }
    } catch (error) {
      toast.error("Update Failed");
    }
  };

  // Drag and Drop Handlers
  const onDragStart = (e: React.DragEvent, event: CalendarEvent) => {
    if (event.isLocked) {
      e.preventDefault();
      return;
    }
    setDraggedEvent(event);
    e.dataTransfer.setData("eventId", event.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const onDrop = async (e: React.DragEvent, date: Date, hour: number) => {
    e.preventDefault();
    if (!draggedEvent) return;
    if (draggedEvent.isLocked) {
      setDraggedEvent(null);
      toast.error("This meeting is locked and cannot be moved");
      return;
    }

    const newStart = new Date(date);
    newStart.setHours(hour, draggedEvent.start.getMinutes());
    
    const duration = differenceInHours(draggedEvent.end, draggedEvent.start);
    const newEnd = addHours(newStart, duration);

    await handleUpdateEvent(draggedEvent.id, { start: newStart, end: newEnd });
    setDraggedEvent(null);
  };

  // Resize Handlers
  const onResizeStart = (e: React.MouseEvent, event: CalendarEvent) => {
    if (event.isLocked) return;
    e.stopPropagation();
    e.preventDefault();
    setResizingEvent(event);
    setResizeStartY(e.clientY);
    const rect = (e.target as HTMLElement).parentElement?.getBoundingClientRect();
    if (rect) setResizeStartHeight(rect.height);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizingEvent) return;
      // Visual feedback could be added here if we had a dedicated state for temporary height
    };

    const handleMouseUp = async (e: MouseEvent) => {
      if (!resizingEvent) return;
      
      const deltaY = e.clientY - resizeStartY;
      const hoursDelta = Math.round(deltaY / 48); // 48px = 1 hour on our compact grid
      
      if (hoursDelta !== 0) {
        const newEnd = addHours(resizingEvent.end, hoursDelta);
        if (newEnd > resizingEvent.start) {
          await handleUpdateEvent(resizingEvent.id, { end: newEnd });
        }
      }
      
      setResizingEvent(null);
    };

    if (resizingEvent) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [resizingEvent, resizeStartY]);

  const EventCard = ({ event, isMonthView = false }: { event: CalendarEvent, isMonthView?: boolean }) => {
    if (isMonthView) {
      return (
        <div 
          draggable={!event.isLocked}
          onDragStart={(e) => onDragStart(e, event)}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-white/5 shadow-sm text-[9px] font-black uppercase tracking-widest truncate group/ev hover:border-[#012169] cursor-grab active:cursor-grabbing"
        >
          <div className={cn("w-1.5 h-1.5 rounded-full shrink-0", event.type === 'TASK' ? 'bg-[#012169]' : 'bg-amber-500')} />
          {event.title}
        </div>
      );
    }

    const startHour = event.start.getHours() + event.start.getMinutes() / 60;
    const endHour = event.end.getHours() + event.end.getMinutes() / 60;
    const top = startHour * 48; // 48px per hour
    const height = Math.max((endHour - startHour) * 48, 24);

    return (
      <div
        draggable={!event.isLocked}
        onDragStart={(e) => onDragStart(e, event)}
        style={{ top, height }}
        className={cn(
          "absolute left-1 right-1 rounded-xl p-2 border shadow-xl transition-all group overflow-hidden z-20 backdrop-blur-md animate-in zoom-in-95 duration-300",
          event.isLocked ? "cursor-not-allowed" : "cursor-grab active:cursor-grabbing",
          event.type === 'TASK' 
            ? "bg-[#012169]/20 border-blue-500/40 text-blue-100 ring-1 ring-white/10" 
            : "bg-amber-600/20 border-amber-500/40 text-amber-100 ring-1 ring-white/10"
        )}
      >
        <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 blur-xl rounded-full -translate-x-1/2 -translate-y-1/2" />
        <div className="flex flex-col h-full relative z-10">
          <div className="flex items-center gap-1.5 mb-0.5">
             <div className={cn("w-1.5 h-1.5 rounded-full", event.type === 'TASK' ? 'bg-blue-400' : 'bg-amber-400')} />
             <span className="text-[10px] font-black uppercase tracking-tight truncate leading-tight">{event.title}</span>
          </div>
          <p className="text-[8px] font-bold opacity-50 tabular-nums">
            {format(event.start, 'HH:mm')} — {format(event.end, 'HH:mm')}
          </p>
          {event.isLocked && (
            <p className="text-[8px] font-black uppercase tracking-widest text-white/70 mt-0.5">Locked meeting</p>
          )}
          
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={(e) => { e.stopPropagation(); handleDeleteEvent(event.id); }}
              className="p-1 px-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
          
          <div 
            onMouseDown={(e) => onResizeStart(e, event)}
            className={cn(
              "absolute bottom-0 left-0 right-0 h-3 flex items-center justify-center transition-opacity",
              event.isLocked ? "opacity-0 pointer-events-none" : "cursor-ns-resize opacity-0 group-hover:opacity-100"
            )}
          >
            <div className="w-10 h-1 bg-white/20 rounded-full hover:bg-white/40 transition-colors" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full mx-auto px-2 sm:px-4 py-4 sm:py-6 space-y-6 animate-in fade-in duration-1000 pb-32 overflow-x-hidden">
      {/* Premium Intelligence Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 sm:gap-8 bg-zinc-900 border-[3px] sm:border-[4px] border-zinc-100 dark:border-zinc-800 rounded-[2rem] sm:rounded-[3rem] p-4 sm:p-8 relative overflow-hidden group shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#012169]/20 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-[#012169]/30 transition-all duration-1000" />
        
        <div className="relative z-10 space-y-8">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 rounded-[2rem] bg-[#012169] flex items-center justify-center text-white shadow-2xl shadow-blue-500/40 shrink-0">
              <CalendarIcon className="w-8 h-8" />
            </div>
            <div className="space-y-1">
               <h1 className="text-4xl sm:text-7xl font-black tracking-tighter text-white uppercase italic leading-none">
                 Timeline <span className="text-zinc-500 not-italic">Engine</span>
               </h1>
               <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500 ml-1">Temporal Operations Protocol v2.0</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <div className="flex bg-zinc-800 p-1.5 rounded-[1.5rem] border border-white/5">
              {(['MONTH', 'WEEK', 'DAY'] as const).map((view) => (
                <button
                  key={view}
                  onClick={() => setViewMode(view)}
                  className={cn(
                    "px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all",
                    viewMode === view 
                      ? "bg-[#012169] text-white shadow-lg" 
                      : "text-zinc-500 hover:text-white"
                  )}
                >
                  {view}
                </button>
              ))}
            </div>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="px-10 py-4 bg-zinc-800 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-zinc-700 transition-all shadow-xl flex items-center gap-3 active:scale-95 border border-white/5"
            >
              <Settings2 className="w-4 h-4 text-blue-300" /> Core Config
            </button>
            <button 
              onClick={() => { setSelectedDate(new Date()); setIsTaskModalOpen(true); }}
              className="px-10 py-4 bg-[#012169] text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-black transition-all shadow-2xl shadow-blue-900/20 flex items-center gap-3 active:scale-95"
            >
              <Plus className="w-4 h-4" /> Initialize Task
            </button>
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-3 sm:gap-4 bg-zinc-800/50 p-2 sm:p-3 rounded-[2rem] border border-white/5 backdrop-blur-xl shrink-0 self-center lg:self-end">
          <button onClick={() => setCurrentDate(new Date())} className="px-4 py-3 rounded-xl bg-zinc-900 border border-white/5 text-[9px] font-black uppercase tracking-widest text-blue-300 hover:text-white transition-all active:scale-95">Today</button>
          <button onClick={handlePrev} className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center hover:bg-[#012169] transition-all active:scale-90 text-zinc-400 hover:text-white">
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          <div className="px-4 sm:px-6 text-center space-y-1 min-w-[120px] sm:min-w-[160px]">
            <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500">Scanning Window</p>
            <h2 className="text-lg sm:text-2xl font-black italic tracking-tighter text-white uppercase leading-none">
              {viewMode === 'MONTH' ? format(currentDate, "MMMM yyyy") : 
               viewMode === 'WEEK' ? `Week ${format(currentDate, "w")}` : 
               format(currentDate, "MMM dd, yyyy")}
            </h2>
          </div>
          <button onClick={handleNext} className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center hover:bg-[#012169] transition-all active:scale-90 text-zinc-400 hover:text-white">
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>
      </div>

      <div className="rounded-[2.5rem] sm:rounded-[3.5rem] border border-zinc-200 dark:border-zinc-900 bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden shelf-shadow border-b-[8px]">
        {viewMode === 'MONTH' && (
          <>
            <div className="grid grid-cols-7 border-b border-zinc-200 bg-zinc-50/70">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="py-6 sm:py-10 text-center border-r border-zinc-200 last:border-r-0">
                  <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.4em] text-zinc-400">{day}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((day, i) => (
                <div
                  key={day.toString()}
                  onClick={() => { 
                    setCurrentDate(day);
                    setViewMode('DAY');
                  }}
                  className={cn(
                    "h-32 sm:h-48 xl:h-64 p-3 sm:p-6 border-r border-b border-zinc-200 group cursor-pointer transition-all hover:bg-blue-50/20 relative",
                    !isSameMonth(day, monthStart) && "opacity-45 bg-zinc-50/50",
                    isSameDay(day, new Date()) && "bg-blue-50/30"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <span className={cn(
                      "text-xl sm:text-3xl font-black tracking-tighter italic",
                      isSameDay(day, new Date()) ? "text-[#012169]" : "text-zinc-600 group-hover:text-zinc-900 transition-colors"
                    )}>
                      {format(day, "d")}
                    </span>
                    {isSameDay(day, new Date()) && (
                      <div className="w-2 h-2 rounded-full bg-[#012169] animate-pulse shadow-[0_0_10px_#4f46e5]" />
                    )}
                  </div>
                  <div className="mt-2 sm:mt-4 space-y-1 sm:space-y-2 overflow-hidden max-h-[70%]">
                    {events.filter(e => isSameDay(e.start, day)).slice(0, 3).map(event => (
                      <EventCard key={event.id} event={event} isMonthView />
                    ))}
                    <div className="sm:hidden flex flex-wrap gap-1">
                      {events.filter(e => isSameDay(e.start, day)).map(e => (
                        <div key={e.id} className="w-1.5 h-1.5 rounded-full bg-[#012169]" />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {(viewMode === 'WEEK' || viewMode === 'DAY') && (
          <div className="flex flex-col h-[750px] sm:h-[800px] overflow-hidden">
            {/* Headers */}
            <div className="flex border-b border-zinc-200 bg-zinc-50/70">
              <div className="w-14 sm:w-20 shrink-0 border-r border-transparent" />
              {(viewMode === 'WEEK' 
                ? eachDayOfInterval({ start: startOfWeek(currentDate), end: endOfWeek(currentDate) })
                : [currentDate]
              ).map((day) => (
                <div key={day.toString()} className="flex-1 py-4 sm:py-6 text-center border-r border-zinc-200 last:border-r-0 min-w-0">
                  <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-zinc-400 mb-1 leading-none">{format(day, 'EEE')}</p>
                  <p className={cn(
                    "text-xl sm:text-2xl font-black italic tracking-tighter leading-none",
                    isSameDay(day, new Date()) ? "text-[#012169]" : "text-zinc-900"
                  )}>{format(day, 'd')}</p>
                </div>
              ))}
            </div>

            {/* Scrollable Grid */}
            <div className="flex-1 overflow-y-auto relative custom-scrollbar overflow-x-hidden">
              <div className="flex min-w-full">
                {/* Time Indicators */}
                <div className="w-12 sm:w-16 shrink-0 bg-zinc-50/70 border-r border-zinc-200">
                  {Array.from({ length: 24 }).map((_, i) => (
                    <div key={i} className="h-12 flex items-center justify-center border-b border-zinc-200">
                      <span className="text-[8px] font-black text-zinc-400 tabular-nums">{format(setHours(startOfDay(new Date()), i), 'HH:mm')}</span>
                    </div>
                  ))}
                </div>

                {/* Columns */}
                {(viewMode === 'WEEK'
                  ? eachDayOfInterval({ start: startOfWeek(currentDate), end: endOfWeek(currentDate) })
                  : [currentDate]
                ).map((day) => (
                  <div 
                    key={day.toString()} 
                    className="flex-1 relative border-r border-zinc-200 last:border-r-0 min-w-0 min-h-[1152px]"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const y = e.clientY - rect.top;
                      const hour = Math.floor(y / 48);
                      onDrop(e, day, hour);
                    }}
                  >
                    {/* Hourly Slots for clicking */}
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div 
                        key={i} 
                        onClick={() => { 
                          const dateWithHour = setHours(day, i);
                          setSelectedDate(dateWithHour); 
                          setNewEvent(prev => ({ ...prev, startTime: format(dateWithHour, 'HH:mm'), endTime: format(addHours(dateWithHour, 1), 'HH:mm') }));
                          setIsTaskModalOpen(true); 
                        }}
                        className="h-12 border-b border-zinc-200 hover:bg-[#012169]/5 transition-colors cursor-cell" 
                      />
                    ))}
                    
                    {/* Events */}
                    {events
                      .filter(e => isSameDay(e.start, day))
                      .map(event => (
                        <EventCard key={event.id} event={event} />
                      ))
                    }
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Core Config Modal */}
      {isSettingsOpen && (
        <div className="responsive-modal-overlay">
           <div className="responsive-modal-container max-w-xl">
              <div className="responsive-modal-header flex items-center justify-between">
                 <div>
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter text-zinc-900 dark:text-zinc-50">Core Logic Config</h3>
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Temporal Parameter Adjustment</p>
                 </div>
                 <button onClick={() => setIsSettingsOpen(false)} className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                    <X className="w-6 h-6" />
                 </button>
              </div>

              <div className="responsive-modal-body space-y-10 custom-scrollbar">
                 <form id="settings-form" onSubmit={handleSaveSettings} className="space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Day Start</label>
                          <input 
                            type="time"
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl px-6 py-4 text-sm font-bold focus:border-blue-600 outline-none transition-all"
                            value={calendarSettings.availableStart}
                            onChange={e => setCalendarSettings({...calendarSettings, availableStart: e.target.value})}
                          />
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Day End</label>
                          <input 
                            type="time"
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl px-6 py-4 text-sm font-bold focus:border-blue-600 outline-none transition-all"
                            value={calendarSettings.availableEnd}
                            onChange={e => setCalendarSettings({...calendarSettings, availableEnd: e.target.value})}
                          />
                       </div>
                    </div>

                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Time Zone</label>
                       <select 
                         className="w-full bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl px-6 py-4 text-sm font-bold focus:border-blue-600 outline-none transition-all"
                         value={calendarSettings.timeZone}
                         onChange={e => setCalendarSettings({...calendarSettings, timeZone: e.target.value})}
                       >
                         <option value="UTC">UTC (Universal)</option>
                         <option value="America/New_York">EST (Eastern)</option>
                         <option value="Europe/London">GMT (London)</option>
                         <option value="Asia/Tokyo">JST (Tokyo)</option>
                       </select>
                    </div>

                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Reminder Gateway</label>
                       <select 
                         className="w-full bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl px-6 py-4 text-sm font-bold focus:border-blue-600 outline-none transition-all"
                         value={calendarSettings.reminderAccountId || ""}
                         onChange={e => setCalendarSettings({...calendarSettings, reminderAccountId: e.target.value})}
                       >
                         <option value="">No account linked</option>
                         {emailAccounts.map(acc => (
                           <option key={acc.id} value={acc.id}>{acc.email}</option>
                         ))}
                       </select>
                       <p className="text-[9px] font-medium text-zinc-500">Reminders will be dispatched via this node.</p>
                    </div>
                 </form>
              </div>

              <div className="responsive-modal-footer flex items-center justify-end gap-4 bg-zinc-50/50 dark:bg-zinc-900/50">
                 <button onClick={() => setIsSettingsOpen(false)} className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Abort</button>
                 <button 
                   form="settings-form"
                   type="submit"
                   className="px-10 py-4 bg-[#012169] text-white rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest hover:bg-zinc-900 transition-all shadow-xl shadow-blue-900/20 active:scale-95"
                 >
                   Save Logic
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Standard Setup Modal - Fixed Visibility */}
      {!emailLinked && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-zinc-950/80 backdrop-blur-md animate-in fade-in duration-500">
           <div className="bg-white dark:bg-zinc-950 w-full max-w-2xl rounded-[3rem] sm:rounded-[4.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.5)] overflow-hidden border border-zinc-100 dark:border-zinc-900 relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-[#012169]/10 blur-[80px] rounded-full translate-x-1/2 -translate-y-1/2" />
              
              <div className="p-10 sm:p-16 space-y-10 relative z-10">
                 <div className="space-y-4">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-[#012169] flex items-center justify-center text-white shadow-xl shadow-blue-900/20">
                      <Zap className="w-8 h-8" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-3xl sm:text-5xl font-black uppercase italic tracking-tighter leading-none">BritSync Sync <span className="text-zinc-400 not-italic">Required</span></h3>
                      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-400">Temporal Data Loss Detected</p>
                    </div>
                 </div>

                 <p className="text-zinc-500 font-bold text-lg leading-relaxed italic">
                   Chronological integrity is compromised. Link your <span className="text-[#012169] font-black underline underline-offset-4 decoration-2">SMTP Neural Gateway</span> to enable temporal task synchronization and event notifications.
                 </p>

                 <div className="flex flex-col sm:flex-row gap-4 pt-4">
                    <button 
                      onClick={() => setEmailLinked(true)}
                      className="px-10 py-5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#012169] hover:text-white transition-all shadow-2xl active:scale-95 flex items-center justify-center gap-3"
                    >
                      Initialize Link <ChevronRight className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setEmailLinked(true)}
                      className="px-10 py-5 text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-[9px] font-black uppercase tracking-widest transition-colors flex items-center justify-center"
                    >
                      Bypass Safety Protocol
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Task Initialization Modal - Using Global Responsive Helpers */}
      {isTaskModalOpen && (
        <div className="responsive-modal-overlay">
           <div className="responsive-modal-container max-w-xl">
              <div className="responsive-modal-header flex items-center justify-between">
                 <div>
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter text-zinc-900 dark:text-zinc-50">Log Temporal Directive</h3>
                    <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">{selectedDate ? format(selectedDate, 'MMM dd, yyyy') : 'NO DATE SELECTED'}</p>
                 </div>
                 <button onClick={() => setIsTaskModalOpen(false)} className="w-12 h-12 rounded-2xl bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                    <X className="w-6 h-6" />
                 </button>
              </div>

              <div className="responsive-modal-body space-y-10 custom-scrollbar">
                 <form onSubmit={handleCreateEvent} className="space-y-10">
                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Directive Title</label>
                       <input 
                         required
                         type="text"
                         placeholder="PHANTOM PROTOCOL..."
                         className="w-full bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl px-6 py-4 text-sm font-bold focus:border-blue-600 outline-none transition-all placeholder:opacity-30 uppercase italic"
                         value={newEvent.title}
                         onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                       />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Activation</label>
                          <input 
                            required
                            type="time"
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl px-6 py-4 text-sm font-bold focus:border-blue-600 outline-none transition-all"
                            value={newEvent.startTime}
                            onChange={e => setNewEvent({...newEvent, startTime: e.target.value})}
                          />
                       </div>
                       <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Termination</label>
                          <input 
                            required
                            type="time"
                            className="w-full bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl px-6 py-4 text-sm font-bold focus:border-blue-600 outline-none transition-all"
                            value={newEvent.endTime}
                            onChange={e => setNewEvent({...newEvent, endTime: e.target.value})}
                          />
                       </div>
                    </div>

                    <div className="space-y-3">
                       <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Directive Briefing</label>
                       <textarea 
                         className="w-full bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-100 dark:border-zinc-800 rounded-2xl px-6 py-4 text-sm font-bold focus:border-blue-600 outline-none transition-all h-32 placeholder:opacity-30"
                         placeholder="Instruction set summary..."
                         value={newEvent.description}
                         onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                       />
                    </div>
                 </form>
              </div>

              <div className="responsive-modal-footer flex items-center justify-end gap-4 bg-zinc-50/50 dark:bg-zinc-900/50">
                 <button onClick={() => setIsTaskModalOpen(false)} className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-zinc-900 transition-colors">Abort</button>
                 <button 
                   onClick={handleCreateEvent}
                   className="px-10 py-4 bg-[#012169] text-white rounded-[1.2rem] text-[10px] font-black uppercase tracking-widest hover:bg-zinc-900 transition-all shadow-xl shadow-blue-900/20 active:scale-95"
                 >
                   Deploy Directive
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
