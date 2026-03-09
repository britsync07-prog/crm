"use client";

import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import { 
  getCountriesAction, 
  getLocationsAction, 
  startLeadFinderJobAction, 
  getJobStatusAction,
  getLatestJobAction,
  getAllJobsAction,
  getCategoriesAction,
  createCategoryAction,
  importScrapedLeadsAction
} from "./actions";
import { 
  Globe, 
  MapPin, 
  Search, 
  Download, 
  FileText, 
  Phone, 
  Mail, 
  CheckCircle2, 
  Loader2,
  AlertCircle,
  Clock,
  Layers,
  Database,
  Plus
} from "lucide-react";

export default function LeadFinderPage() {
  const [countries, setCountries] = useState<string[]>([]);
  const [states, setStates] = useState<string[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  
  const [selectedCountry, setSelectedCountry] = useState("");
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [niches, setNiches] = useState("");
  
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isFetchingLocations, setIsFetchingLocations] = useState(false);

  useEffect(() => {
    async function init() {
      const [countryData, historyData, categoryData] = await Promise.all([
        getCountriesAction(),
        getAllJobsAction(),
        getCategoriesAction()
      ]);
      
      setCountries(countryData);
      setHistory(historyData);
      setCategories(categoryData);

      const latestJob = historyData[0];
      if (latestJob) {
        setJobId(latestJob.id);
        try {
          const status = await getJobStatusAction(latestJob.id);
          setJobStatus(status);
        } catch (e) {
          console.error("Error restoring latest job status", e);
        }
      }
    }
    init();
  }, []);

  useEffect(() => {
    async function loadLocations() {
      if (!selectedCountry) {
        setStates([]);
        return;
      }
      setIsFetchingLocations(true);
      const data = await getLocationsAction(selectedCountry);
      setStates(data.states || []);
      setIsFetchingLocations(false);
    }
    loadLocations();
  }, [selectedCountry]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    const terminalStatuses = ["Completed", "Failed", "Stopped", "completed", "failed", "stopped"];
    
    async function pollStatus() {
      if (!jobId) return;
      try {
        const data = await getJobStatusAction(jobId);
        setJobStatus(data);
        if (!terminalStatuses.includes(data.status)) {
          timeoutId = setTimeout(pollStatus, 3000);
        } else {
          if (data.status === "Completed" || data.status === "completed") {
            toast.success("Scraping complete!");
          } else if (data.status === "Failed" || data.status === "failed") {
            toast.error(`Scraping failed: ${data.message || 'Unknown error'}`);
          }
          const historyData = await getAllJobsAction();
          setHistory(historyData);
        }
      } catch (error) {
        console.error("Failed to fetch job status", error);
        if (jobId) timeoutId = setTimeout(pollStatus, 5000);
      }
    }

    if (jobId && !terminalStatuses.includes(jobStatus?.status || "")) {
      timeoutId = setTimeout(pollStatus, 3000);
    }
    return () => { if (timeoutId) clearTimeout(timeoutId); };
  }, [jobId]);

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    setIsCreatingCategory(true);
    try {
      const cat = await createCategoryAction(newCategoryName.trim());
      setCategories([...categories, cat]);
      setSelectedCategoryId(cat.id);
      setNewCategoryName("");
      toast.success(`Category "${cat.name}" created!`);
    } catch (e) {
      toast.error("Failed to create category");
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleStartJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCountry || !niches) {
      toast.error("Country and Niches are required");
      return;
    }

    setIsLoading(true);
    try {
      setJobStatus(null);
      setJobId(null);
      const nichesArray = niches.split(',').map(n => n.trim()).filter(n => n !== "");
      
      // Use selected category or the new one if typed
      let categoryId = selectedCategoryId;
      
      const data = await startLeadFinderJobAction(selectedCountry, selectedStates, nichesArray, categoryId);
      setJobId(data.jobId);
      
      const historyData = await getAllJobsAction();
      setHistory(historyData);
      toast.success("Scraping job started!");
    } catch (error: any) {
      toast.error(error.message || "Failed to start job");
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportLeads = async (id: string) => {
    setIsImporting(true);
    try {
      const result = await importScrapedLeadsAction(id);
      toast.success(`Successfully imported ${result.imported} leads to CRM!`);
    } catch (error: any) {
      toast.error(error.message || "Failed to import leads");
    } finally {
      setIsImporting(false);
    }
  };

  const isRunning = !!(jobId && !["Completed", "Failed", "Stopped", "completed", "failed", "stopped"].includes(jobStatus?.status || ""));

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-10 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-zinc-900 rounded-[40px] p-10 border border-white/5 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
        <div className="relative z-10 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg">
              <Globe className="w-5 h-5" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-white uppercase italic">
              Global <span className="text-indigo-500 not-italic">Lead Finder</span>
            </h1>
          </div>
          <p className="text-zinc-400 font-medium max-w-xl text-lg">
            Target specific markets and organize them instantly into categories.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        <div className="lg:col-span-1 space-y-8">
          <div className="bg-white dark:bg-zinc-950 p-8 rounded-[40px] border border-zinc-200 dark:border-white/10 shadow-sm sticky top-10">
            <h2 className="text-xl font-black uppercase italic tracking-tight mb-8 flex items-center gap-2">
              <Search className="w-5 h-5 text-indigo-500" /> Target Parameters
            </h2>
            
            <form onSubmit={handleStartJob} className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em] mb-2 block">Country</label>
                <select
                  className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-zinc-900 dark:text-white"
                  value={selectedCountry}
                  onChange={(e) => setSelectedCountry(e.target.value)}
                  disabled={isRunning}
                >
                  <option value="">Select a country</option>
                  {Array.isArray(countries) && countries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em] mb-2 block flex justify-between items-center">
                  <span>States / Regions</span>
                  {states.length > 0 && (
                    <button 
                      type="button"
                      onClick={() => {
                        if (selectedStates.length === states.length) setSelectedStates([]);
                        else setSelectedStates([...states]);
                      }}
                      className="text-[9px] text-indigo-500 hover:text-indigo-400 transition-colors font-black uppercase"
                    >
                      {selectedStates.length === states.length ? "Deselect All" : "Select All"}
                    </button>
                  )}
                  {isFetchingLocations && <Loader2 className="w-3 h-3 animate-spin inline ml-2" />}
                </label>
                <div className="bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl p-4 max-h-[150px] overflow-y-auto space-y-2">
                  {states.length === 0 ? (
                    <p className="text-xs text-zinc-500 italic">Select a country first</p>
                  ) : (
                    states.map(state => (
                      <label key={state} className="flex items-center gap-3 cursor-pointer group">
                        <input
                          type="checkbox"
                          className="w-4 h-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                          checked={selectedStates.includes(state)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedStates([...selectedStates, state]);
                            else setSelectedStates(selectedStates.filter(s => s !== state));
                          }}
                          disabled={isRunning}
                        />
                        <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300 group-hover:text-indigo-500 transition-colors">{state}</span>
                      </label>
                    ))
                  )}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em] mb-2 block">Category (Optional)</label>
                <div className="space-y-3">
                  <select
                    className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-zinc-900 dark:text-white"
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    disabled={isRunning}
                  >
                    <option value="">Auto-create from niches</option>
                    {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                  </select>
                  
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className="flex-1 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-xl p-3 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-zinc-900 dark:text-white text-xs"
                      placeholder="New category name..."
                      value={newCategoryName}
                      onChange={(e) => setNewCategoryName(e.target.value)}
                      disabled={isRunning || isCreatingCategory}
                    />
                    <button
                      type="button"
                      onClick={handleCreateCategory}
                      disabled={isRunning || isCreatingCategory || !newCategoryName.trim()}
                      className="p-3 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-xl hover:opacity-80 transition-all disabled:opacity-30"
                    >
                      {isCreatingCategory ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em] mb-2 block">Niches (Comma separated)</label>
                <textarea
                  className="w-full bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10 rounded-2xl p-4 outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-zinc-900 dark:text-white"
                  placeholder="Plumbers, Real Estate, Gyms"
                  value={niches}
                  onChange={(e) => setNiches(e.target.value)}
                  disabled={isRunning}
                  rows={2}
                />
              </div>

              <button
                type="submit"
                disabled={isRunning || isLoading || !selectedCountry}
                className="w-full bg-indigo-600 text-white font-black uppercase italic tracking-widest p-4 rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Executing...
                  </>
                ) : "Launch Engine"}
              </button>
            </form>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-10">
          {jobId && (
            <div className="bg-white dark:bg-zinc-950 p-10 rounded-[40px] border border-zinc-200 dark:border-white/10 shadow-sm space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black uppercase italic tracking-tight">Operation Status</h3>
                  <p className="text-zinc-500 font-medium">Job ID: <span className="text-indigo-500">{jobId}</span></p>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                  ['Completed', 'completed'].includes(jobStatus?.status) ? 'bg-green-100 text-green-700' :
                  ['Failed', 'failed'].includes(jobStatus?.status) ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'
                }`}>
                  {jobStatus?.status || 'Initiating'}
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Mission Progress</span>
                  <span className="text-sm font-black text-indigo-500">{Math.min(100, Math.round((jobStatus?.leadsFound || 0) / 100 * 100))}%</span>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-white/5 rounded-full h-4 overflow-hidden p-1">
                  <div 
                    className="bg-indigo-600 h-full rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(79,70,229,0.5)]"
                    style={{ width: `${Math.min(100, (jobStatus?.leadsFound || 0) / 100 * 100)}%` }}
                  ></div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: "Leads Collected", value: `${jobStatus?.leadsFound || 0} / 100`, icon: CheckCircle2 },
                  { label: "Email Status", value: "Active", icon: Mail },
                  { label: "Phone Status", value: "Verified", icon: Phone },
                  { label: "CSV Engine", value: "Ready", icon: FileText },
                ].map((stat, i) => (
                  <div key={i} className="bg-zinc-50 dark:bg-white/5 p-6 rounded-3xl border border-zinc-100 dark:border-white/5">
                    <stat.icon className="w-5 h-5 text-indigo-500 mb-4" />
                    <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">{stat.label}</p>
                    <p className="text-xl font-black text-zinc-900 dark:text-white mt-1">{stat.value}</p>
                  </div>
                ))}
              </div>

              {['Completed', 'completed'].includes(jobStatus?.status) && (
                <div className="pt-10 border-t border-zinc-100 dark:border-white/5 space-y-8">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xl font-black uppercase italic tracking-tight">Intelligence Assets</h4>
                    <button
                      onClick={() => handleImportLeads(jobId)}
                      disabled={isImporting}
                      className="bg-indigo-600 text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-50"
                    >
                      {isImporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Database className="w-3 h-3" />}
                      {isImporting ? "Importing..." : "Import to CRM"}
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { name: "all_emails.txt", label: "Email Database", icon: Mail, color: "hover:border-blue-500/50" },
                      { name: "all_phones.txt", label: "Phone Register", icon: Phone, color: "hover:border-green-500/50" },
                      { name: "google_maps_all.csv", label: "Master CSV", icon: FileText, color: "hover:border-amber-500/50" },
                    ].map((file) => (
                      <a
                        key={file.name}
                        href={`/api/leads/download/${jobId}/${file.name}`}
                        target="_blank"
                        rel="noreferrer"
                        className={`flex flex-col items-center p-8 bg-zinc-50 dark:bg-white/5 rounded-3xl border border-zinc-100 dark:border-white/5 transition-all group ${file.color}`}
                      >
                        <file.icon className="w-10 h-10 text-zinc-400 group-hover:text-indigo-500 transition-colors mb-4" />
                        <span className="text-[10px] font-black uppercase text-zinc-400 tracking-[0.2em] text-center">{file.label}</span>
                        <div className="mt-4 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all flex items-center gap-2">
                          <Download className="w-3 h-3" />
                          Download
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {!jobId && (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30">
              <div className="w-24 h-24 rounded-[40px] bg-zinc-100 dark:bg-white/5 flex items-center justify-center">
                <MapPin className="w-10 h-10" />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase italic tracking-tight">Intelligence Feed Empty</h3>
                <p className="font-medium text-zinc-500">Configure target parameters to launch discovery mission.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <MissionHistory history={history} currentJobId={jobId} onImport={handleImportLeads} isImporting={isImporting} />
    </div>
  );
}

function MissionHistory({ history, currentJobId, onImport, isImporting }: { history: any[], currentJobId: string | null, onImport: (id: string) => void, isImporting: boolean }) {
  const formatLocation = (location: string) => {
    if (!location) return "Unknown";
    if (!location.includes(':')) return location;
    const [country, statesStr] = location.split(':');
    const states = statesStr.split(',').map(s => s.trim()).filter(s => s !== "");
    if (states.length <= 5) return location;
    return `${country}: ${states.slice(0, 5).join(', ')} +${states.length - 5} more`;
  };

  return (
    <div className="bg-white dark:bg-zinc-950 p-10 rounded-[40px] border border-zinc-200 dark:border-white/10 shadow-sm space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-black uppercase italic tracking-tight flex items-center gap-2">
          <Clock className="w-6 h-6 text-indigo-500" /> Mission Archive
        </h3>
        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">{history.length} Operations logged</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-white/5">
              <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Date</th>
              <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Target</th>
              <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Niches</th>
              <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-zinc-400">Status</th>
              <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-zinc-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-white/5">
            {history.map((job: any) => (
              <tr key={job.id} className={`group ${job.id === currentJobId ? 'bg-indigo-50/50 dark:bg-indigo-500/5' : ''}`}>
                <td className="py-6">
                  <p className="text-xs font-bold text-zinc-900 dark:text-white">{new Date(job.createdAt).toLocaleDateString()}</p>
                  <p className="text-[10px] text-zinc-500 font-medium">{new Date(job.createdAt).toLocaleTimeString()}</p>
                </td>
                <td className="py-6">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3 h-3 text-indigo-500" />
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300" title={job.location}>{formatLocation(job.location)}</span>
                  </div>
                </td>
                <td className="py-6"><span className="text-xs font-medium text-zinc-500">{job.keyword}</span></td>
                <td className="py-6">
                  <span className={`px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    ['Completed', 'completed'].includes(job.status) ? 'bg-green-100 text-green-700' :
                    ['Failed', 'failed'].includes(job.status) ? 'bg-red-100 text-red-700' : 'bg-indigo-100 text-indigo-700'
                  }`}>{job.status}</span>
                </td>
                <td className="py-6 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {['Completed', 'completed'].includes(job.status) && (
                      <>
                        <button
                          onClick={() => onImport(job.id)}
                          disabled={isImporting}
                          className="p-2 rounded-lg bg-zinc-100 dark:bg-white/5 hover:bg-indigo-600 hover:text-white transition-all group/btn"
                          title="Import to CRM"
                        >
                          <Database className="w-3 h-3" />
                        </button>
                        {[
                          { name: "all_emails.txt", icon: Mail },
                          { name: "all_phones.txt", icon: Phone },
                          { name: "google_maps_all.csv", icon: FileText },
                        ].map((file) => (
                          <a
                            key={file.name}
                            href={`/api/leads/download/${job.id}/${file.name}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 rounded-lg bg-zinc-100 dark:bg-white/5 hover:bg-indigo-600 hover:text-white transition-all"
                            title={`Download ${file.name}`}
                          >
                            <file.icon className="w-3 h-3" />
                          </a>
                        ))}
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {history.length === 0 && (
              <tr><td colSpan={5} className="py-12 text-center text-zinc-500 italic opacity-50">No mission logs found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
