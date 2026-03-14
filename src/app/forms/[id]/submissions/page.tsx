"use client";

import { useEffect, useState, use } from "react";
import { 
  FileText, 
  Loader2, 
  ArrowLeft, 
  Download, 
  Mail, 
  Calendar,
  Layers
} from "lucide-react";
import Link from "next/link";
import { toast } from "react-hot-toast";

interface Field {
  id: string;
  label: string;
}

interface Submission {
  id: string;
  data: Record<string, any>;
  createdAt: string;
  crm?: {
    submitterEmail?: string | null;
    leadId?: string | null;
    leadStatus?: string | null;
    customerId?: string | null;
    customerStatus?: string | null;
    meetingBooked?: boolean;
  };
}

export default function SubmissionsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [data, setData] = useState<{ formTitle: string; fields: Field[]; submissions: Submission[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`/api/forms/${id}/submissions`);
        if (res.ok) {
          setData(await res.json());
        } else {
          toast.error("Form not found or access denied");
        }
      } catch (e) {
        toast.error("Failed to load submissions");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const downloadCSV = () => {
    if (!data) return;
    const headers = ["Date", ...data.fields.map(f => f.label)].join(",");
    const rows = data.submissions.map(s => {
      const rowData = [
        new Date(s.createdAt).toLocaleString(),
        ...data.fields.map(f => {
          const val = s.data[f.id];
          return Array.isArray(val) ? `"${val.join(', ')}"` : `"${val || ''}"`;
        })
      ];
      return rowData.join(",");
    });
    
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows.join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${data.formTitle}_submissions.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-black">
        <Loader2 className="w-10 h-10 animate-spin text-[#012169]" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <Link href="/forms" className="flex items-center gap-2 text-zinc-500 hover:text-[#012169] text-xs font-black uppercase tracking-widest mb-4 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to Forms
          </Link>
          <h1 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50 uppercase italic truncate max-w-xl">
            {data.formTitle}
          </h1>
          <p className="text-zinc-500 font-medium mt-1">Viewing all {data.submissions.length} submissions received.</p>
        </div>

        <button
           onClick={downloadCSV}
           disabled={data.submissions.length === 0}
           className="px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-black font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-lg flex items-center justify-center gap-2 transform hover:scale-105 disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {data.submissions.length === 0 ? (
        <div className="text-center py-32 bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-xl">
          <Layers className="w-16 h-16 text-zinc-200 dark:text-zinc-800 mx-auto mb-4" />
          <h3 className="text-xl font-bold dark:text-white">No data yet</h3>
          <p className="text-zinc-500 mt-2">Share your form link to start collecting responses.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-200 dark:border-zinc-800">
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Date Received</th>
                  <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">CRM Link</th>
                  {data.fields.map(f => (
                    <th key={f.id} className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 whitespace-nowrap">
                      {f.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {data.submissions.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-900/30 transition-colors">
                    <td className="px-6 py-4 text-xs font-mono text-zinc-500 whitespace-nowrap">
                       <span className="flex items-center gap-2">
                         <Calendar className="w-3.5 h-3.5 text-[#012169]" />
                         {new Date(s.createdAt).toLocaleString()}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-zinc-700 dark:text-zinc-300 whitespace-nowrap">
                      <div className="flex flex-wrap items-center gap-2">
                        {s.crm?.leadId ? (
                          <Link href={`/leads/${s.crm.leadId}`} className="px-2 py-0.5 rounded bg-blue-50 text-[#012169] dark:bg-[#012169]/10 dark:text-blue-300 text-[10px] font-black uppercase tracking-wide">
                            Lead: {s.crm.leadStatus || "Linked"}
                          </Link>
                        ) : (
                          <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[10px] font-black uppercase tracking-wide">No Lead</span>
                        )}
                        {s.crm?.customerId ? (
                          <Link href={`/customers/${s.crm.customerId}`} className="px-2 py-0.5 rounded bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-300 text-[10px] font-black uppercase tracking-wide">
                            Customer: {s.crm.customerStatus || "Linked"}
                          </Link>
                        ) : null}
                        {s.crm?.meetingBooked ? (
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300 text-[10px] font-black uppercase tracking-wide">Meeting</span>
                        ) : null}
                      </div>
                    </td>
                    {data.fields.map(f => (
                      <td key={f.id} className="px-6 py-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        {Array.isArray(s.data[f.id]) ? (
                          <div className="flex flex-wrap gap-1">
                            {s.data[f.id].map((v: string) => (
                              <span key={v} className="px-2 py-0.5 bg-blue-50 dark:bg-[#012169]/10 text-[#012169] dark:text-blue-300 rounded text-[10px] font-bold">
                                {v}
                              </span>
                            ))}
                          </div>
                        ) : (
                          s.data[f.id] || "—"
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
