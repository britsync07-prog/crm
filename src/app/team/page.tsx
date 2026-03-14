import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import {
  Users2,
  ShieldCheck,
  Briefcase,
  TrendingUp,
  Clock,
  MapPin,
  MoreVertical,
  Plus,
  Search,
  CheckCircle2,
  Calendar
} from "lucide-react";
import Link from "next/link";

export default async function TeamPage() {
  const session = await getSession();
  const userId = session.id;

  // Real HR Data filtered by workspace/user
  const employees = await prisma.employee.findMany({
    where: { workspace: { ownerId: userId } },
    include: {
      user: true,
      attendances: {
        where: {
          date: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }
    }
  });

  const departments = Array.from(new Set(employees.map(e => e.department).filter(Boolean)));

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-zinc-100 dark:border-white/5 pb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 uppercase italic flex items-center gap-3">
            <Users2 className="w-8 h-8 text-[#012169]" /> Human <span className="text-[#012169] not-italic">Resources</span>
          </h1>
          <p className="text-zinc-500 font-medium mt-1">Personnel management and operational performance tracking.</p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/team/new"
            className="flex items-center gap-2 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black px-6 py-3 text-xs font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-xl"
          >
            <Plus className="w-4 h-4" /> Add Personnel
          </Link>
        </div>
      </div>

      {/* Team Intelligence Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#012169] p-8 rounded-[40px] text-white space-y-6 shadow-2xl shadow-blue-900/20 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform">
            <ShieldCheck className="w-24 h-24" />
          </div>
          <div className="relative z-10">
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-200 mb-2">Operation Status</p>
            <h3 className="text-3xl font-black italic">Fully Staffed</h3>
            <div className="flex items-center gap-4 mt-6">
              <div>
                <p className="text-2xl font-black">{employees.length}</p>
                <p className="text-[10px] font-bold uppercase text-blue-200">Total Active</p>
              </div>
              <div className="w-px h-10 bg-white/20"></div>
              <div>
                <p className="text-2xl font-black">{employees.filter(e => e.attendances.length > 0).length}</p>
                <p className="text-[10px] font-bold uppercase text-blue-200">On Duty</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-8 rounded-[40px] border border-zinc-200 dark:border-white/10 shadow-sm space-y-6">
          <div className="flex justify-between items-start">
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-white/5 text-green-500">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-black bg-green-100 text-green-700 px-2 py-1 rounded-lg uppercase tracking-tighter">+8.2%</span>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em]">Efficiency Rating</p>
            <p className="text-3xl font-black text-zinc-900 dark:text-white mt-1">94.8%</p>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-8 rounded-[40px] border border-zinc-200 dark:border-white/10 shadow-sm space-y-6">
          <div className="flex justify-between items-start">
            <div className="p-3 rounded-2xl bg-zinc-50 dark:bg-white/5 text-amber-500">
              <Clock className="w-6 h-6" />
            </div>
          </div>
          <div>
            <p className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em]">Active Overtime</p>
            <p className="text-3xl font-black text-zinc-900 dark:text-white mt-1">12.5 hrs</p>
          </div>
        </div>
      </div>

      {/* Personnel Directory */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black uppercase italic tracking-tight">Active Personnel</h2>
          <div className="flex items-center gap-2">
            {departments.map(dept => (
              <button key={dept} className="px-4 py-1.5 rounded-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:border-[#012169] hover:text-[#012169] transition-all">
                {dept}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map((emp) => (
            <div key={emp.id} className="bg-white dark:bg-zinc-950 p-8 rounded-[40px] border border-zinc-200 dark:border-white/10 shadow-sm relative group hover:border-blue-700/30 transition-all">
              <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-xl font-black text-zinc-400">
                    {emp.user.name?.[0] || emp.user.email[0]}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg text-zinc-900 dark:text-white">{emp.user.name || "Unnamed"}</h4>
                    <p className="text-xs text-zinc-500 font-medium uppercase tracking-widest">{emp.position || "Staff"}</p>
                  </div>
                </div>
                <button className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-400 transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-white/5">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-zinc-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Department</span>
                  </div>
                  <span className="text-[10px] font-black text-zinc-900 dark:text-white uppercase">{emp.department || "General"}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 dark:bg-white/5">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-zinc-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Pulse Status</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${emp.attendances.length > 0 ? 'bg-green-500 animate-pulse' : 'bg-zinc-300'}`}></div>
                    <span className="text-[10px] font-black text-zinc-900 dark:text-white uppercase">{emp.attendances.length > 0 ? 'On Site' : 'Offline'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter">Compensation</p>
                  <p className="text-sm font-black text-[#012169] mt-1">${emp.salary?.toLocaleString() || "0"}/mo</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-tighter">Comm.</p>
                  <p className="text-sm font-black text-green-500 mt-1">{emp.commission || "0"}%</p>
                </div>
              </div>
            </div>
          ))}
          {employees.length === 0 && (
            <div className="col-span-full py-20 text-center opacity-30 italic font-medium text-zinc-500 border-2 border-dashed border-zinc-200 dark:border-white/10 rounded-[40px]">
              No personnel records found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
