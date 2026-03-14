import Link from "next/link";
import { 
  Globe, 
  Sparkles, 
  Layers, 
  Network, 
  Database, 
  Cpu, 
  ArrowRight,
  Zap,
  Activity,
  Server,
  Cloud,
  MapPin,
  BarChart3,
  TrendingUp,
  Box,
  MessageCircle,
  Mail,
  Share2,
  CheckCircle2,
  PieChart,
  HardDrive
} from "lucide-react";

const SMTP_ROTATION_WIDTHS = [82, 67, 94, 51, 73, 88, 46, 79];

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="text-zinc-400 hover:text-white transition-colors duration-300 font-medium tracking-tight">
    {children}
  </Link>
);

export default function GlobalScalePage() {
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
          <span className="text-blue-300 text-[10px] font-black uppercase tracking-[0.4em] italic">Architected for Hyper-Growth</span>
          <h1 className="text-6xl md:text-9xl font-black tracking-tighter leading-[0.85] text-white">
            Global <br /> <span className="text-[#012169] italic">Reach.</span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed font-medium">
 Deploy thousands of agents across dozens of countries with zero infrastructure overhead. BritCRM scales as fast as your ambition.
          </p>
        </section>

        {/* 1. Infrastructure Map */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5">
          <div className="grid lg:grid-cols-2 gap-32 items-center">
            <div className="space-y-16">
              <div className="space-y-6 text-left">
                <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase">The Global <br /> Grid.</h2>
                <p className="text-lg text-zinc-400 font-medium leading-relaxed">
                  Our multi-tenant engine is built on a globally distributed mesh network of AI nodes. This ensures low-latency execution and high deliverability.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                {[
                  { title: "Multi-Region Nodes", desc: "Agents operate locally to bypass regional latency and filters.", icon: Network },
                  { title: "Dynamic Routing", desc: "Auto-rotation of SMTP and Proxy assets for 99% deliverability.", icon: Activity },
                  { title: "Isolated Tenants", desc: "Hardware-level separation of your workspace and data.", icon: Layers },
                  { title: "Auto-Elasticity", desc: "Scale from 10 to 10,000 agents instantly.", icon: Zap }
                ].map((item, i) => (
                  <div key={i} className="space-y-4 p-6 rounded-3xl bg-white/5 border border-white/5 hover:border-[#012169] transition-all">
                    <div className="w-10 h-10 rounded-xl bg-[#012169]/20 flex items-center justify-center text-blue-300">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-white uppercase italic text-sm">{item.title}</h4>
                    <p className="text-xs text-zinc-500 font-medium leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-[80px] bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-transparent"></div>
                <Globe className="w-64 h-64 text-[#012169]/20 animate-[spin_20s_linear_infinite] group-hover:text-[#012169]/40 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className="w-32 h-32 bg-[#012169]/20 blur-[60px] rounded-full animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Cultural Intelligence */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5 bg-white/[0.01]">
          <div className="max-w-4xl mx-auto text-center space-y-12">
            <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase">Localization.</h2>
            <p className="text-xl text-zinc-400 font-medium leading-relaxed">
              Scale doesn't mean generic. Our agents understand the nuances of business etiquette in Tokyo, London, and New York simultaneously.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pt-12">
               {["EMEA Hub", "APAC Node", "LATAM Grid", "NA Backbone"].map(region => (
                 <div key={region} className="p-8 rounded-[40px] bg-white/5 border border-white/10 space-y-4 text-center">
                    <MapPin className="w-6 h-6 text-[#012169] mx-auto" />
                    <p className="text-[10px] font-black uppercase text-white tracking-[0.2em]">{region}</p>
                 </div>
               ))}
            </div>
          </div>
        </section>

        {/* 3. Proxy & SMTP Mesh */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-10 text-left">
              <h2 className="text-5xl font-black text-white italic tracking-tighter leading-none">Deliverability <br /> <span className="text-[#012169] not-italic">Infrastructure.</span></h2>
              <p className="text-lg text-zinc-400 leading-relaxed font-medium">
                We maintain a pool of 100,000+ residential and mobile proxies to ensure your AI agents can research and engage leads without being blocked by perimeter security.
              </p>
              <div className="flex gap-4">
                 <span className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase text-zinc-400 tracking-widest">Fixed IP Vault</span>
                 <span className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase text-zinc-400 tracking-widest">Mobile Mesh</span>
              </div>
            </div>
            <div className="p-12 bg-zinc-900 border border-white/5 rounded-[60px] space-y-8 shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#012169]/5 blur-3xl"></div>
               <div className="flex justify-between items-center mb-4">
                  <span className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em] italic">SMTP ROTATION PULSE</span>
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
               </div>
               <div className="grid grid-cols-4 gap-4">
                  {SMTP_ROTATION_WIDTHS.map((width, i) => (
                    <div key={i} className="h-1 bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full bg-[#012169]" style={{ width: `${width}%` }}></div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </section>

        {/* 4. Cross-Region Workspaces */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5 bg-white/[0.01]">
          <div className="text-center space-y-16">
            <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase">Unified Command.</h2>
            <div className="grid lg:grid-cols-3 gap-8">
               {[
                 { title: "Team Isolation", desc: "Separate data, settings, and agents for every regional team with zero cross-contamination." },
                 { title: "Global Sync", desc: "Unified reporting across all regional workspaces in one central executive dashboard." },
                 { title: "RBAC Governance", desc: "Fine-grained permissions for global admins and local territory managers." }
               ].map((item, i) => (
                 <div key={i} className="p-12 rounded-[48px] bg-white/5 border border-white/10 space-y-6 hover:bg-white/[0.08] transition-all text-left group">
                    <Box className="w-10 h-10 text-[#012169] group-hover:scale-110 transition-transform duration-500" />
                    <h4 className="text-2xl font-black text-white italic uppercase tracking-tight">{item.title}</h4>
                    <p className="text-zinc-500 text-sm font-medium leading-relaxed">{item.desc}</p>
                 </div>
               ))}
            </div>
          </div>
        </section>

        {/* 5. Performance Matrix */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5">
          <div className="bg-zinc-900 rounded-[60px] p-16 md:p-32 border border-white/5 relative overflow-hidden flex flex-col md:flex-row items-center gap-20 shadow-2xl">
            <div className="flex-1 space-y-8 relative z-10 text-left">
              <h2 className="text-5xl font-black text-white italic tracking-tighter leading-none uppercase">Execution <br /> Velocity.</h2>
              <p className="text-lg text-zinc-400 font-medium max-w-sm leading-relaxed">
                Scale your outreach from hundreds to millions of interactions per month with zero drop in deliverability.
              </p>
              <div className="flex gap-12">
                 <div className="space-y-1">
                    <p className="text-4xl font-black text-white italic">1.4M</p>
                    <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.3em]">Monthly Volume</p>
                 </div>
                 <div className="space-y-1 border-l border-white/10 pl-12">
                    <p className="text-4xl font-black text-white italic">0.2%</p>
                    <p className="text-[9px] font-black uppercase text-zinc-500 tracking-[0.3em]">Bounce Limit</p>
                 </div>
              </div>
            </div>
            <div className="flex-1 w-full grid grid-cols-2 gap-6 opacity-20 hover:opacity-100 transition-opacity duration-1000">
               {Array.from({ length: 4 }).map((_, i) => (
                 <div key={i} className="h-40 rounded-[40px] bg-white/5 border border-white/10 flex flex-col items-center justify-center space-y-4">
                    <HardDrive className="w-6 h-6 text-[#012169]" />
                    <span className="font-black italic text-[10px] text-zinc-500 uppercase tracking-widest">NODE_SEC_{i}</span>
                 </div>
               ))}
            </div>
          </div>
        </section>

        {/* 6. Multi-Agent Swarming */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5 bg-white/[0.01]">
          <div className="grid lg:grid-cols-2 gap-32 items-center">
            <div className="relative">
               <div className="aspect-video rounded-[60px] bg-[#012169]/10 border border-blue-500/20 flex items-center justify-center shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[#012169]/20 blur-[100px] animate-pulse"></div>
                  <Cpu className="w-24 h-24 text-[#012169] relative z-10 group-hover:scale-110 transition-transform duration-1000" />
               </div>
            </div>
            <div className="space-y-10 text-left">
              <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-tight">Agent <br /> <span className="text-[#012169] not-italic">Orchestration.</span></h2>
              <p className="text-xl text-zinc-400 font-medium leading-relaxed">
                Deploy "pods" of agents that coordinate. Agent A researches news, Agent B writes the context-aware hook, and Agent C monitors for high-intent replies.
              </p>
              <ul className="space-y-6">
                 {[
                   "Collaborative neural decision paths",
                   "Shared context across all channels",
                   "Autonomous task hand-off protocol"
                 ].map(item => (
                   <li key={item} className="flex items-center gap-4 text-zinc-300 font-bold">
                      <CheckCircle2 className="w-5 h-5 text-[#012169]" />
                      <span className="uppercase text-xs tracking-widest">{item}</span>
                   </li>
                 ))}
              </ul>
            </div>
          </div>
        </section>

        {/* 7. The Scale FAQ */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5 bg-white/[0.01]">
          <div className="max-w-3xl mx-auto space-y-12">
            <h2 className="text-4xl font-black text-white italic tracking-tighter text-center uppercase">Scale Intelligence FAQ.</h2>
            <div className="space-y-6 text-left">
              {[
                { q: "How do you handle IP warming at scale?", a: "Our platform has built-in 'Automated Warmup' that gradually increases volume over 14-21 days using peer-to-peer cognitive networks." },
                { q: "Can I use multiple SMTP providers?", a: "Yes. You can mix Gmail, Outlook, Amazon SES, and SendGrid within a single campaign for redundant deliverability." },
                { q: "Is there a limit to territorial expansion?", a: "None. You can spin up new workspace clusters for any country or region instantly through the Command Bridge." }
              ].map((faq, i) => (
                <div key={i} className="p-10 rounded-[40px] bg-white/5 border border-white/10 space-y-4 hover:bg-white/[0.08] transition-all">
                  <h4 className="text-xl font-bold text-white italic">{faq.q}</h4>
                  <p className="text-zinc-500 text-sm font-medium leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 8. Global Infrastructure Status */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5">
          <div className="bg-zinc-900 rounded-[60px] p-16 text-center space-y-10 relative overflow-hidden border border-white/5">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
            <h2 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter uppercase">Infrastructure Pulse.</h2>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-40">
              {["12 GLOBAL REGIONS", "420TB DATA THROUGHPUT", "0.4s AI LATENCY", "ELITE STATUS"].map(stat => (
                <span key={stat} className="text-[10px] font-black uppercase tracking-[0.4em] text-white">{stat}</span>
              ))}
            </div>
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
 <p className="text-zinc-500 text-xs font-black tracking-[0.4em]">© 2026 BritCRM by BritSync. Hyper-growth, engineered.</p>
        </div>
      </footer>
    </div>
  );
}
