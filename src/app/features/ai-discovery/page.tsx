import Link from "next/link";
import { 
  Search, 
  Sparkles, 
  ArrowRight, 
  PlayCircle, 
  Globe, 
  Database, 
  Cpu, 
  TrendingUp,
  Zap,
  CheckCircle2,
  Share2,
  Lock,
  MousePointer2,
  Layers,
  Network
} from "lucide-react";

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="text-zinc-400 hover:text-white transition-colors duration-300 font-medium tracking-tight">
    {children}
  </Link>
);

export default function AIDiscoveryPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#030303] text-zinc-100 overflow-x-hidden selection:bg-[#012169] selection:text-white font-sans antialiased">
      {/* Immersive Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#012169]/10 blur-[160px] rounded-full"></div>
        <div className="absolute bottom-[10%] right-[-5%] w-[40%] h-[40%] bg-violet-600/10 blur-[140px] rounded-full"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
      </div>

      {/* Glass Navbar */}
      <header className="fixed top-0 w-full z-50 px-6 py-6 flex justify-center">
        <div className="max-w-6xl w-full h-16 bg-white/5 border border-white/10 backdrop-blur-xl rounded-full px-8 flex items-center justify-between shadow-2xl">
          <Link href="/landing" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#012169] rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20 rotate-3">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
 <span className="text-xl font-black tracking-tighter italic text-white hidden sm:block">BritCRM</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
            <NavLink href="/features/ai-discovery">Discovery</NavLink>
            <NavLink href="/features/cognitive-writing">Cognitive SDR</NavLink>
            <NavLink href="/solutions/enterprise">Shield</NavLink>
            <NavLink href="/solutions/global-scale">Scale</NavLink>
            <NavLink href="/vision/manifesto">Manifesto</NavLink>
          </nav>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-[11px] font-black uppercase tracking-widest text-zinc-400 hover:text-white transition-colors">Login</Link>
            <Link href="/signup" className="bg-white text-black px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] hover:bg-[#012169] hover:text-white transition-all duration-500 shadow-xl">
              Join Now
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 relative z-10 pt-48 pb-32">
        {/* Hero Section */}
        <section className="container mx-auto px-6 text-center space-y-12 max-w-6xl">
          <span className="text-blue-300 text-[10px] font-black uppercase tracking-[0.4em] italic">Autonomous Lead Sourcing</span>
          <h1 className="text-6xl md:text-9xl font-black tracking-tighter leading-[0.85] text-white">
            Discovery <br /> <span className="text-[#012169] italic">without limits.</span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed font-medium">
            Stop scraping. Start understanding. Our discovery engine analyzes business models and financial signals to find your perfect ICP.
          </p>
        </section>

        {/* 1. Universal Data Mesh */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5">
          <div className="text-center space-y-6 mb-24">
            <h2 className="text-5xl font-black tracking-tighter text-white italic">Universal Data Mesh.</h2>
            <p className="text-zinc-500 max-w-xl mx-auto font-medium leading-relaxed">We don't rely on a single database. We orchestrate a mesh of 40+ global providers.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {["LinkedIn", "Crunchbase", "Apollo", "GitHub", "Twitter/X", "ProductHunt", "Dribbble", "Behance"].map((source) => (
              <div key={source} className="p-8 rounded-[32px] bg-white/5 border border-white/10 flex flex-col items-center justify-center text-center space-y-4 hover:bg-white/[0.08] transition-all">
                <div className="w-12 h-12 rounded-xl bg-[#012169]/20 flex items-center justify-center text-blue-300 font-black italic">
                  {source[0]}
                </div>
                <span className="font-bold text-white uppercase tracking-widest text-xs">{source}</span>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Programmatic Intent */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5">
          <div className="grid lg:grid-cols-2 gap-32 items-center">
            <div className="space-y-12">
              <h2 className="text-5xl font-black tracking-tighter text-white italic">Programmatic <br /> Intent Monitoring.</h2>
              <p className="text-lg text-zinc-400 leading-relaxed font-medium">
                Our agents monitor 12+ data streams simultaneously—from job postings and patent filings to news signals and social intent.
              </p>
              <div className="space-y-6">
                {[
                  { title: "Financial Signal Analysis", desc: "Identify expansion, funding rounds, and fiscal health." },
                  { title: "Technographic Fingerprinting", desc: "Find companies using specific competitors or complementary tech." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6 p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-blue-700/30 transition-colors">
                    <div className="w-12 h-12 rounded-2xl bg-[#012169]/20 flex items-center justify-center text-blue-300 shrink-0">
                      <Zap className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-white mb-1">{item.title}</h4>
                      <p className="text-sm text-zinc-500 font-medium">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-[#012169]/10 blur-[120px] rounded-full"></div>
              <div className="relative p-1 rounded-[60px] bg-gradient-to-br from-white/10 to-transparent">
                <div className="bg-[#09090b] rounded-[58px] p-12 space-y-8 border border-white/5 overflow-hidden">
                  <div className="flex justify-between items-center mb-8">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#012169]">Live Intent Stream</span>
                    <div className="flex gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500/50"></div>
                      <div className="w-2 h-2 rounded-full bg-green-500/50"></div>
                    </div>
                  </div>
                  {[
                    { lead: "TechCorp.ai", signal: "New Series B", score: 98 },
                    { lead: "LogisticsGo", signal: "Expansion into EU", score: 92 },
                    { lead: "CloudFlow", signal: "Hiring 12+ Devs", score: 87 }
                  ].map((lead, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 animate-pulse" style={{ animationDelay: `${i*300}ms` }}>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center font-black text-zinc-500">{lead.lead[0]}</div>
                        <div>
                          <p className="text-sm font-bold text-white">{lead.lead}</p>
                          <p className="text-[10px] text-zinc-500 uppercase font-black">{lead.signal}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-black text-[#012169]">{lead.score}</p>
                        <p className="text-[8px] text-zinc-600 font-black uppercase">Intent Score</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 3. Verification Protocol */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5 bg-white/[0.01]">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-10">
              <h2 className="text-5xl font-black tracking-tighter text-white italic">Verification <br /> <span className="text-[#012169] not-italic">at the Edge.</span></h2>
              <p className="text-lg text-zinc-400 leading-relaxed font-medium">
                Our proprietary verification protocol ensures 99.9% email deliverability. Every lead is checked against 7 different SMTP and MX servers.
              </p>
              <div className="flex gap-4">
                <div className="px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3" /> Real-time MX Check
                </div>
                <div className="px-4 py-2 rounded-xl bg-[#012169]/10 border border-blue-500/20 text-[#012169] text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3" /> Syntax Validation
                </div>
              </div>
            </div>
            <div className="p-10 bg-black border border-white/10 rounded-[60px] space-y-6 shadow-2xl shadow-blue-500/5">
              <div className="flex items-center gap-3 border-b border-white/5 pb-6">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-ping"></div>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Verifying Batch #842...</span>
              </div>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex justify-between items-center text-sm font-medium border-b border-white/5 pb-2">
                  <span className="text-zinc-400 italic">prospect_{i}@global_tech.com</span>
                  <span className="text-green-500 font-bold uppercase text-[10px]">Valid & Secure</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 4. Competitor Intelligence */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5">
          <div className="max-w-4xl mx-auto space-y-12">
            <h2 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter leading-none text-center">Track Competitors. <br /> <span className="text-[#012169] not-italic underline decoration-blue-500/30 underline-offset-8">Steal Deals.</span></h2>
            <div className="grid md:grid-cols-2 gap-12 pt-12 text-left">
              <div className="p-10 rounded-[40px] bg-white/5 border border-white/10 space-y-6 hover:border-[#012169] transition-all">
                <h4 className="text-xl font-bold text-white uppercase italic tracking-tight">Hire Tracking</h4>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  Automatically discover when your competitors hire new SDRs or Sales leaders. This is a primary intent signal for tool replacement.
                </p>
              </div>
              <div className="p-10 rounded-[40px] bg-white/5 border border-white/10 space-y-6 hover:border-[#012169] transition-all">
                <h4 className="text-xl font-bold text-white uppercase italic tracking-tight">Review Sentiment</h4>
                <p className="text-zinc-500 text-sm leading-relaxed">
                  Our AI monitors G2 and Capterra. When a competitor user leaves a negative review about 'deliverability', we trigger an outreach event.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Interactive ICP Builder Preview */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5">
          <div className="bg-[#012169] rounded-[60px] p-16 md:p-32 flex flex-col md:flex-row items-center gap-20 overflow-hidden relative shadow-2xl">
            <div className="flex-1 space-y-8 relative z-10 text-left">
              <h2 className="text-5xl font-black text-white italic tracking-tighter leading-none">Architect your <br /> Perfect Client.</h2>
              <p className="text-lg text-blue-100 font-medium leading-relaxed">
                Use our cognitive builder to define not just titles and industries, but specific psychological profiles and business triggers.
              </p>
              <button className="px-10 py-5 bg-white text-[#012169] rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] hover:scale-95 transition-all shadow-2xl">Launch ICP Lab</button>
            </div>
            <div className="flex-1 w-full bg-white/10 backdrop-blur-3xl p-12 rounded-[40px] border border-white/20 space-y-8 opacity-50 relative group cursor-not-allowed">
               <div className="absolute inset-0 flex items-center justify-center z-20">
                  <span className="bg-white text-black px-4 py-2 rounded-lg font-black text-[10px] uppercase tracking-widest shadow-xl">Interactive Preview</span>
               </div>
               <div className="h-4 w-3/4 bg-white/20 rounded-full"></div>
               <div className="h-4 w-1/2 bg-white/20 rounded-full"></div>
               <div className="grid grid-cols-2 gap-6">
                  <div className="h-32 bg-white/10 rounded-3xl border border-white/10"></div>
                  <div className="h-32 bg-white/10 rounded-3xl border border-white/10"></div>
               </div>
               <div className="h-4 w-full bg-white/20 rounded-full"></div>
            </div>
          </div>
        </section>

        {/* 6. SDR Hand-off Logic */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5 bg-white/[0.01]">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="relative p-12 bg-white/5 border border-white/10 rounded-[60px] space-y-8 backdrop-blur-3xl group hover:border-[#012169]/50 transition-all">
               <TrendingUp className="w-20 h-20 text-[#012169] opacity-20 group-hover:scale-110 transition-transform duration-1000" />
               <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Cognitive Load <br /> Balancing.</h3>
               <p className="text-zinc-500 text-sm leading-relaxed font-medium">
                 Discovered leads aren't just dumped. They are analyzed for "Cognitive Weight" and assigned to the SDR with the highest historical conversion for that specific industry segment.
               </p>
            </div>
            <div className="space-y-10 text-left">
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white italic">Elite Human <br /> <span className="text-[#012169] not-italic">Augmentation.</span></h2>
              <p className="text-xl text-zinc-400 font-medium leading-relaxed">
                We don't replace your top SDRs. We give them 10x the bandwidth. The machine finds the gold; the human closes the deal.
              </p>
              <div className="flex gap-8">
                 <div>
                    <p className="text-4xl font-black text-white italic">10x</p>
                    <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mt-1">Efficiency Delta</p>
                 </div>
                 <div className="w-px h-12 bg-white/10"></div>
                 <div>
                    <p className="text-4xl font-black text-white italic">Zero</p>
                    <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mt-1">Manual Sourcing</p>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Global Data Infrastructure */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5">
          <div className="bg-zinc-900 rounded-[60px] p-16 md:p-32 text-center space-y-12 relative overflow-hidden border border-white/5">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
            <h2 className="text-5xl md:text-8xl font-black text-white italic tracking-tighter leading-none relative z-10">Global Data <br /> Local Context.</h2>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto relative z-10 font-medium leading-relaxed">
              Our discovery agents understand cultural nuances across 100+ countries, ensuring your lists aren't just large—they're accurate.
            </p>
            <div className="flex flex-wrap justify-center gap-12 relative z-10 opacity-40">
              {["42 Data Sources", "Zero Proxies Needed", "100% Verified", "AI Verified", "Real-time MX"].map(item => (
                <span key={item} className="text-xs font-black uppercase tracking-[0.4em] text-white">{item}</span>
              ))}
            </div>
          </div>
        </section>

        {/* 8. Integration Matrix */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5">
          <div className="text-center space-y-12">
            <h2 className="text-5xl font-black tracking-tighter text-white italic">The Integration Matrix.</h2>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-8 opacity-20 hover:opacity-100 transition-opacity duration-1000">
              {["HubSpot", "Salesforce", "Pipedrive", "Zendesk", "Slack", "Zapier", "Make", "Airtable", "Notion", "Google Sheets", "Excel", "Segment"].map(i => (
                <div key={i} className="aspect-square bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center font-black text-[10px] uppercase tracking-widest text-zinc-500 hover:text-white transition-colors">{i}</div>
              ))}
            </div>
          </div>
        </section>

        {/* 9. Discovery FAQ */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5 bg-white/[0.01]">
          <div className="max-w-3xl mx-auto space-y-12">
            <h2 className="text-4xl font-black text-white italic tracking-tighter text-center uppercase">Intelligence FAQ.</h2>
            <div className="space-y-6">
              {[
                { q: "How fresh is the data?", a: "Most providers update weekly. Our engine crawls in real-time when an intent trigger is detected, ensuring data is never more than 24 hours old." },
                { q: "Do you support niche industries?", a: "Yes. Our cognitive agents can learn niche business models via your website and find prospects based on specific technical or service signals." },
                { q: "Is this GDPR compliant?", a: "100%. We only source professional, publicly available data and include built-in governance layers for EU compliance." },
                { q: "Can I export to my own CRM?", a: "Absolutely. We have native bi-directional sync with HubSpot, Salesforce, and Pipedrive, plus a robust API for custom builds." }
              ].map((faq, i) => (
                <div key={i} className="p-10 rounded-[40px] bg-white/5 border border-white/10 space-y-4 hover:bg-white/[0.08] transition-all">
                  <h4 className="text-xl font-bold text-white italic flex justify-between items-center">
                    {faq.q}
                    <ArrowRight className="w-5 h-5 text-[#012169]" />
                  </h4>
                  <p className="text-zinc-500 text-sm font-medium leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 10. Economics of Discovery */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5">
          <div className="bg-[#012169] rounded-[60px] p-16 md:p-32 text-center space-y-12 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
            <h2 className="text-4xl md:text-7xl font-black text-white italic tracking-tighter uppercase">Scale your Sourcing.</h2>
            <p className="text-xl text-blue-100 font-medium max-w-xl mx-auto italic">High-fidelity data shouldn't be a luxury.</p>
            <div className="grid md:grid-cols-3 gap-12 relative z-10 max-w-5xl mx-auto pt-12">
               <div className="p-8 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-md space-y-4">
                  <p className="text-xs font-black text-white/50 uppercase tracking-widest italic">Base Tier</p>
                  <p className="text-5xl font-black text-white">$0.40<span className="text-sm">/Lead</span></p>
               </div>
               <div className="p-8 rounded-3xl bg-white text-[#012169] scale-110 shadow-2xl space-y-4">
                  <p className="text-xs font-black uppercase tracking-widest italic">Growth Tier</p>
                  <p className="text-5xl font-black">$0.12<span className="text-sm">/Lead</span></p>
               </div>
               <div className="p-8 rounded-3xl bg-white/10 border border-white/20 backdrop-blur-md space-y-4">
                  <p className="text-xs font-black text-white/50 uppercase tracking-widest italic">Elite Tier</p>
                  <p className="text-5xl font-black text-white">Flat<span className="text-sm">/Fee</span></p>
               </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="container mx-auto px-6 py-40 text-center space-y-12 border-t border-white/5">
          <h3 className="text-4xl md:text-8xl font-black text-white italic tracking-tighter">Ready to find <br /> <span className="text-[#012169] not-italic underline underline-offset-8">your next win?</span></h3>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-12">
            <Link href="/signup" className="group bg-[#012169] text-white px-16 py-8 rounded-[32px] text-2xl font-black transition-all hover:bg-[#012169] shadow-2xl hover:scale-105 flex items-center gap-4">
              Launch Agent <ArrowRight className="w-6 h-6" />
            </Link>
          </div>
        </section>
      </main>

      <footer className="bg-[#030303] border-t border-white/5 py-20">
        <div className="container mx-auto px-6 text-center space-y-10">
          <div className="flex items-center justify-center gap-3">
            <div className="w-9 h-9 bg-[#012169] rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
 <span className="text-xl font-black tracking-tighter italic text-white">BritCRM</span>
          </div>
 <p className="text-zinc-500 text-xs font-black tracking-[0.4em]">© 2026 BritCRM by BritSync. The future is autonomous.</p>
        </div>
      </footer>
    </div>
  );
}
