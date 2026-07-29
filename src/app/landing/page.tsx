"use client";

import Link from "next/link";
import { 
  CheckCircle2, 
  Zap, 
  Shield, 
  Mail, 
  MessageCircle, 
  Globe, 
  ArrowRight,
  Star,
  PlayCircle,
  HelpCircle,
  TrendingUp,
  Search,
  Sparkles,
  Cpu,
  Network,
  Share2,
  Database
} from "lucide-react";

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="text-zinc-400 hover:text-white transition-colors duration-300 font-medium tracking-tight">
    {children}
  </Link>
);

const FeatureCard = ({ icon: Icon, title, desc, tag }: any) => (
  <div className="relative p-8 rounded-[32px] bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/[0.08] transition-all duration-500 group overflow-hidden">
    <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#012169]/10 blur-[80px] group-hover:bg-[#012169]/20 transition-all duration-500"></div>
    <div className="relative z-10 space-y-6">
      <div className="w-14 h-14 rounded-2xl bg-[#012169]/20 border border-blue-700/30 flex items-center justify-center group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-2xl shadow-blue-900/20">
        <Icon className="w-7 h-7 text-blue-300" />
      </div>
      <div>
        {tag && <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#012169] mb-2 block">{tag}</span>}
        <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">{title}</h3>
        <p className="text-zinc-400 leading-relaxed text-sm font-medium">{desc}</p>
      </div>
    </div>
  </div>
);

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#030303] text-zinc-100 overflow-x-hidden selection:bg-[#012169] selection:text-white font-sans antialiased">
      {/* Immersive Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#012169]/10 blur-[160px] rounded-full"></div>
        <div className="absolute bottom-[10%] right-[-5%] w-[40%] h-[40%] bg-violet-600/10 blur-[140px] rounded-full"></div>
        <div className="absolute top-[20%] left-[30%] w-[30%] h-[30%] bg-blue-600/5 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
      </div>

      {/* Glass Navbar */}
      <header className="fixed top-0 w-full z-50 px-6 py-6 flex justify-center">
        <div className="max-w-6xl w-full h-16 bg-white/5 border border-white/10 backdrop-blur-xl rounded-full px-8 flex items-center justify-between shadow-2xl">
          <Link href="/landing" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#012169] rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20 rotate-3 group cursor-pointer hover:rotate-0 transition-transform duration-500">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
 <span className="text-xl font-black tracking-tighter italic text-white hidden sm:block">BritCRM</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
            <NavLink href="/features/ai-discovery">AI Pipeline</NavLink>
            <NavLink href="/features/cognitive-writing">Smart Inbox</NavLink>
            <NavLink href="/solutions/enterprise">Shield</NavLink>
            <NavLink href="/solutions/global-scale">Scale</NavLink>
            <NavLink href="/pricing">Pricing</NavLink>
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

      <main className="flex-1 relative z-10">
        {/* Cinematic Hero */}
        <section className="container mx-auto px-6 pt-48 pb-32 text-center space-y-12 max-w-6xl">
          <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-blue-300 text-[10px] font-black uppercase tracking-[0.2em] backdrop-blur-md">
            <Cpu className="w-3.5 h-3.5" />
            Empowering 2,000+ Modern Revenue Teams
          </div>
          <h1 className="text-7xl md:text-[120px] font-black tracking-[-0.06em] leading-[0.85] text-white">
            Customer relationships <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-violet-400 to-blue-600 italic px-2">intelligently managed.</span>
          </h1>
          <p className="text-xl md:text-2xl text-zinc-400 max-w-3xl mx-auto leading-relaxed font-medium">
 BritCRM brings your contacts, deals, emails, and tasks into one powerful workspace. Manage relationships, not spreadsheets.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-8">
            <Link href="/signup" className="group w-full sm:w-auto bg-[#012169] text-white px-12 py-6 rounded-[24px] text-xl font-black transition-all hover:bg-[#012169] shadow-[0_20px_80px_-15px_rgba(79,70,229,0.5)] hover:scale-105 flex items-center justify-center gap-4">
              Enter the Future <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-500" />
            </Link>
            <button onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })} className="flex items-center gap-4 text-zinc-400 hover:text-white transition-colors duration-500 group uppercase text-xs font-black tracking-[0.2em]">
              <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:border-[#012169]/50 transition-colors">
                <PlayCircle className="w-5 h-5" />
              </div>
              Product Tour
            </button>
          </div>
        </section>

        {/* 1. The Pulse (Real-time Stats Ticker) */}
        <section className="border-y border-white/5 py-12 overflow-hidden bg-white/[0.01]">
          <div className="flex gap-20 animate-infinite-scroll whitespace-nowrap px-6">
            {[
              { label: "Contacts Managed", val: "50K+" },
              { label: "Deals Tracked", val: "12K+" },
              { label: "Active Revenue", val: "$42M" },
              { label: "Emails Synced", val: "2.1M" },
              { label: "Global Workspaces", val: "4,200+" },
              { label: "Security Events", val: "0 Breaches" }
            ].map((stat, i) => (
              <div key={i} className="flex items-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 italic">{stat.label}</span>
                <span className="text-2xl font-black text-[#012169]">{stat.val}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 ml-10"></div>
              </div>
            ))}
            {/* Duplicate for infinite loop */}
            {[
              { label: "Contacts Managed", val: "50K+" },
              { label: "Deals Tracked", val: "12K+" },
              { label: "Active Revenue", val: "$42M" },
              { label: "Emails Synced", val: "2.1M" },
              { label: "Global Workspaces", val: "4,200+" },
              { label: "Security Events", val: "0 Breaches" }
            ].map((stat, i) => (
              <div key={i+"-dup"} className="flex items-center gap-4">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500 italic">{stat.label}</span>
                <span className="text-2xl font-black text-[#012169]">{stat.val}</span>
                <div className="w-1.5 h-1.5 rounded-full bg-zinc-800 ml-10"></div>
              </div>
            ))}
          </div>
        </section>

        {/* The Engine Loop */}
        <section id="engine" className="container mx-auto px-6 py-40 border-t border-white/5">
          <div className="grid lg:grid-cols-2 gap-32 items-center">
            <div className="space-y-16">
              <div className="space-y-6 text-left">
                <h2 className="text-5xl md:text-7xl font-black tracking-tighter leading-none text-white italic">The Growth <br /> <span className="text-[#012169] not-italic">Engine.</span></h2>
                <p className="text-xl text-zinc-400 font-medium max-w-xl leading-relaxed">A circular automation loop that never stops searching for your next big win.</p>
              </div>
              
              <div className="space-y-12">
                {[
                  { step: "01", title: "Unified Inbox", desc: "Sync Gmail, Outlook, and IMAP accounts into one timeline. Every conversation, every contact, all in one place.", icon: Mail },
                  { step: "02", title: "Pipeline CRM", desc: "Drag-and-drop deal stages, track progress, and never lose sight of where each opportunity stands.", icon: TrendingUp },
                  { step: "03", title: "AI-Powered Insights", desc: "Smart follow-up reminders, deal scoring, and activity suggestions keep your team moving fast.", icon: Zap }
                ].map((item, i) => (
                  <div key={i} className="flex gap-10 group items-start">
                    <span className="text-5xl font-black text-white/5 group-hover:text-[#012169]/20 transition-all duration-700 leading-none">{item.step}</span>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                        {item.title}
                      </h3>
                      <p className="text-zinc-500 font-medium leading-relaxed max-w-sm">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-[#012169]/20 blur-[120px] rounded-full -z-10"></div>
              <div className="p-1 rounded-[60px] bg-gradient-to-br from-white/10 to-transparent">
                <div className="w-full bg-[#09090b] rounded-[58px] p-12 space-y-10 border border-white/5 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                      <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                      <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                    </div>
                    <div className="px-4 py-1.5 rounded-full bg-[#012169]/10 border border-blue-500/20 text-[9px] font-black uppercase tracking-widest text-blue-300">
                      Live Activity Feed
                    </div>
                  </div>
                  <div className="space-y-6">
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/10 space-y-4">
                      <div className="flex justify-between">
                        <div className="h-2 w-32 bg-zinc-800 rounded"></div>
                        <div className="h-2 w-12 bg-zinc-800 rounded"></div>
                      </div>
                      <div className="h-2 w-full bg-[#012169]/20 rounded"></div>
                      <div className="h-2 w-3/4 bg-zinc-800 rounded"></div>
                    </div>
                    <div className="p-6 rounded-3xl bg-[#012169]/10 border border-blue-500/20 transform translate-x-10 shadow-2xl relative overflow-hidden group">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                      <p className="text-xs font-bold text-blue-300 mb-2">SYNCING CONTACTS...</p>
                      <p className="text-sm italic text-white/80 leading-relaxed font-medium">
                        &quot;New deal created: Acme Corp — $24,000. Stage moved to Negotiation. Next task: Send proposal by Friday.&quot;
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 italic font-black">AI</div>
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 italic font-black">S1</div>
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-zinc-500 italic font-black">S2</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. AI SDR Lab (Deep Feature Showcase) */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="order-2 lg:order-1 relative">
              <div className="absolute inset-0 bg-[#012169]/10 blur-[100px] rounded-full"></div>
              <div className="relative p-10 bg-white/5 border border-white/10 rounded-[60px] space-y-8 backdrop-blur-3xl">
                <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[#012169] flex items-center justify-center text-white italic font-black">AI</div>
                  <div>
                    <h4 className="font-bold text-white uppercase italic">Deal #1084</h4>
                    <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest">Stage: Negotiation • Value: $24,000</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-sm italic text-zinc-400">
                    "Contact sent proposal via email. Follow-up task created for Friday. Deal moved from Proposal to Negotiation stage automatically."
                  </div>
                  <div className="flex gap-3">
                    <span className="px-3 py-1 rounded-full bg-[#012169]/20 text-blue-300 text-[10px] font-black">SYNCED</span>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black">ACTIVE</span>
                    <span className="px-3 py-1 rounded-full bg-zinc-500/20 text-zinc-400 text-[10px] font-black">TRACKED</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="order-1 lg:order-2 space-y-10">
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white italic">Full-Funnel <br /> <span className="text-[#012169] not-italic">CRM Platform.</span></h2>
              <p className="text-xl text-zinc-400 font-medium leading-relaxed">
                Stop juggling spreadsheets, email tabs, and sticky notes. BritCRM unifies your customer data into one intelligent hub with real-time sync, smart pipelines, and AI-powered suggestions.
              </p>
              <ul className="space-y-6">
                {[
                  "Unified inbox — Gmail, Outlook, IMAP all in one view",
                  "Custom pipeline stages with drag-and-drop deal management",
                  "Contact timeline — every email, call, and note in one place",
                  "Team collaboration with shared workspaces and roles"
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-4 text-zinc-300 font-bold">
                    <div className="w-2 h-2 rounded-full bg-[#012169]"></div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Our Process Section */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5 bg-white/[0.01]">
          <div className="max-w-4xl mx-auto text-center space-y-10">
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white uppercase italic">The Blueprint.</h2>
            <div className="grid md:grid-cols-4 gap-4">
              {[
                { title: "Import", desc: "Sync contacts from Gmail, Outlook, or CSV in seconds." },
                { title: "Organize", desc: "Tag, categorize, and assign to custom pipeline stages." },
                { title: "Track", desc: "Monitor deal progress, tasks, and team activity in real-time." },
                { title: "Grow", desc: "AI insights and reports help you close more deals." }
              ].map((step, i) => (
                <div key={i} className="p-8 rounded-3xl border border-white/5 bg-white/5 space-y-4 hover:border-blue-700/30 transition-colors">
                  <div className="text-[#012169] font-black text-xl italic">{i + 1}</div>
                  <h4 className="text-white font-bold">{step.title}</h4>
                  <p className="text-zinc-500 text-xs font-medium leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 3. Security & Governance (Deep Dive) */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5">
          <div className="bg-gradient-to-br from-zinc-900 to-black rounded-[60px] p-16 border border-white/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#012169]/5 blur-[150px] rounded-full"></div>
            <div className="grid lg:grid-cols-2 gap-20 items-center">
              <div className="space-y-10">
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-[#012169]">
                  <Shield className="w-8 h-8" />
                </div>
                <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white italic">Hardened for the <br /> <span className="text-[#012169] not-italic">Enterprise.</span></h2>
                <p className="text-lg text-zinc-400 font-medium leading-relaxed">
 Your data is your most valuable asset. We treat it with military-grade respect. BritCRM is built on a foundation of zero-trust architecture and multi-tenant isolation.
                </p>
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h5 className="text-white font-black uppercase text-xs mb-3 italic">Encryption</h5>
                    <p className="text-zinc-500 text-xs font-medium">AES-256 at rest and TLS 1.3 in transit.</p>
                  </div>
                  <div>
                    <h5 className="text-white font-black uppercase text-xs mb-3 italic">Compliance</h5>
                    <p className="text-zinc-500 text-xs font-medium">SOC2 Type II, GDPR, and HIPAA ready.</p>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="p-8 bg-black border border-white/10 rounded-[40px] space-y-6 shadow-2xl">
                  <div className="flex justify-between items-center border-b border-white/5 pb-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Access Control Matrix</span>
                    <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-[10px] font-black">SECURE</span>
                  </div>
                  {[
                    { role: "Global Admin", access: "Full Root Authority" },
                    { role: "Sales Manager", access: "Team & Pipeline Access" },
                    { role: "Sales Rep", access: "Contacts & Deals Only" }
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between items-center py-2">
                      <span className="text-sm font-bold text-white">{row.role}</span>
                      <span className="text-xs font-medium text-zinc-500">{row.access}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Intelligence Grid */}
        <section id="features" className="container mx-auto px-6 py-40 space-y-24">
          <div className="max-w-3xl space-y-6">
            <h2 className="text-5xl md:text-7xl font-black tracking-tight leading-[0.9] text-white">Elite tooling for <br /> <span className="text-[#012169] italic">elite teams.</span></h2>
            <p className="text-xl text-zinc-400 font-medium">Everything you need to manage relationships and close deals — in one place.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Mail} 
              tag="Inbox"
              title="Unified Inbox" 
              desc="Connect Gmail, Outlook, and any IMAP account. All your conversations in one timeline, no switching tabs." 
            />
            <FeatureCard 
              icon={TrendingUp} 
              tag="Pipeline"
              title="Deal Pipeline" 
              desc="Custom stages, drag-and-drop Kanban, deal value tracking — know exactly where every opportunity stands." 
            />
            <FeatureCard 
              icon={Zap} 
              tag="Automation"
              title="Task Automation" 
              desc="Auto-create follow-up tasks, send reminders, and trigger workflows when deals move stages." 
            />
            <FeatureCard 
              icon={MessageCircle} 
              tag="Timeline"
              title="Contact Timeline" 
              desc="Every email, call, note, and meeting logged automatically. Full context at a glance." 
            />
            <FeatureCard 
              icon={Network} 
              tag="Team"
              title="Team Workspaces" 
              desc="Shared pipelines, role-based access, activity feeds — collaborate without the clutter." 
            />
            <FeatureCard 
              icon={Database} 
              tag="Sync"
              title="Email Sync" 
              desc="Bidirectional email sync that keeps your CRM and inbox in perfect harmony." 
            />
          </div>
        </section>

        {/* 4. Trusted By Section */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5">
          <div className="text-center space-y-6 mb-20">
            <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-[#012169]">Every Team, Every Role</h3>
            <h2 className="text-4xl md:text-6xl font-black text-white italic">Built for the <br />Modern Sales Team.</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-12 opacity-30 hover:opacity-100 transition-all duration-1000 items-center justify-items-center">
            {["SALES", "MARKETING", "SUCCESS", "SUPPORT", "REVENUE", "OPS", "FINANCE", "HR", "LEGAL", "PRODUCT", "DATA", "SECURITY"].map(role => (
              <span key={role} className="text-xl font-black tracking-widest text-zinc-500">{role}</span>
            ))}
          </div>
        </section>

        {/* Why Us Section */}
        <section id="why-us" className="container mx-auto px-6 py-40 border-t border-white/5">
          <div className="flex flex-col md:flex-row gap-20 items-center">
            <div className="flex-1 space-y-10">
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-none italic">Built for the <br /> <span className="text-[#012169] not-italic">Hyper-Growth.</span></h2>
              <p className="text-xl text-zinc-400 font-medium leading-relaxed">
 Legacy CRMs are databases. BritCRM is your command center. We don't just store data — we help you act on it with smart pipelines, sync, and AI-powered insights.
              </p>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <h4 className="text-4xl font-black text-white italic">50K+</h4>
                  <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Contacts Managed</p>
                </div>
                <div>
                  <h4 className="text-4xl font-black text-white italic">12K+</h4>
                  <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Deals Tracked</p>
                </div>
                <div>
                  <h4 className="text-4xl font-black text-white italic">12hrs</h4>
                  <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Saved Weekly/Rep</p>
                </div>
                <div>
                  <h4 className="text-4xl font-black text-white italic">100%</h4>
                  <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">GDPR Compliant</p>
                </div>
              </div>
            </div>
            <div className="flex-1 relative">
              <div className="absolute inset-0 bg-[#012169]/10 blur-[100px] rounded-full"></div>
              <div className="relative z-10 p-12 bg-white/5 border border-white/10 rounded-[60px] backdrop-blur-3xl space-y-8">
                {[
                  { title: "Unified Workspace", desc: "Inbox, pipeline, contacts, and tasks — all in one place. No more switching between 10 tabs.", icon: Zap },
                  { title: "Smart Sync", desc: "Bidirectional email sync keeps your CRM and inbox in perfect harmony. Real-time, always.", icon: Globe },
                  { title: "Enterprise Security", desc: "Your data is encrypted at rest and in transit with SOC2 Type II compliance standards.", icon: Shield }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6 items-start">
                    <div className="w-12 h-12 rounded-2xl bg-[#012169]/20 border border-blue-700/30 flex items-center justify-center shrink-0">
                      <item.icon className="w-6 h-6 text-blue-300" />
                    </div>
                    <div>
                      <h5 className="text-xl font-bold text-white mb-2">{item.title}</h5>
                      <p className="text-zinc-500 text-sm font-medium leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Global Scale Section */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5">
          <div className="relative rounded-[60px] bg-[#012169] overflow-hidden p-16 md:p-32 text-center space-y-12 shadow-2xl shadow-blue-500/40">
            <div className="absolute inset-0 opacity-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')]"></div>
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent"></div>
            <h2 className="text-5xl md:text-[100px] font-black tracking-tighter text-white leading-none italic relative z-10">Global Reach. <br /> Local Impact.</h2>
            <p className="text-xl md:text-2xl text-blue-100 font-medium max-w-2xl mx-auto relative z-10">
 BritCRM is used by teams in 45 countries. Manage contacts, track deals, and collaborate across time zones with ease.
            </p>
            <div className="flex flex-wrap justify-center gap-10 relative z-10 pt-10 opacity-60">
              {["USA", "UK", "Germany", "Japan", "Brazil", "India", "Australia"].map(c => (
                <span key={c} className="text-xs font-black uppercase tracking-[0.4em] text-white">{c}</span>
              ))}
            </div>
          </div>
        </section>

        {/* 5. Success Stories (Deep Dive Case Study) */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5">
          <div className="flex flex-col lg:flex-row gap-32 items-center">
            <div className="flex-1 space-y-12">
              <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#012169] italic">Case Study: Orbit Systems</span>
              <h2 className="text-5xl md:text-8xl font-black text-white italic tracking-tighter leading-none">From Zero to <br /> <span className="text-[#012169] not-italic">$12M ARR.</span></h2>
              <p className="text-xl text-zinc-400 font-medium leading-relaxed italic">
 "We were drowning in spreadsheets and disconnected inboxes. BritCRM unified our entire customer workflow in one place. Within 90 days, our team was closing 3x more deals with the same headcount."
              </p>
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 rounded-full bg-zinc-800 border border-white/10 flex items-center justify-center font-black italic">JD</div>
                <div>
                  <h5 className="font-bold text-white">John Doe</h5>
                  <p className="text-xs font-black uppercase tracking-widest text-zinc-500">CEO, Orbit Systems</p>
                </div>
              </div>
            </div>
            <div className="flex-1 w-full">
              <div className="aspect-square rounded-[80px] bg-white/5 border border-white/10 flex items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-[#012169]/5 group-hover:scale-110 transition-transform duration-1000"></div>
                <TrendingUp className="w-48 h-48 text-[#012169]/20 group-hover:scale-125 transition-transform duration-1000" />
                <div className="absolute bottom-20 left-20 right-20 space-y-4">
                  <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 w-full shadow-[0_0_20px_rgba(34,197,94,0.5)]"></div>
                  </div>
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    <span>90-Day Trajectory</span>
                    <span className="text-green-500">+1,400% GROWTH</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. The Manifesto (Strategic Philosophy) */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5">
          <div className="max-w-4xl mx-auto space-y-12">
            <h2 className="text-4xl md:text-[80px] font-black text-white italic tracking-tighter leading-none text-center">Spreadsheets are dead. <br /> <span className="text-[#012169] not-italic underline decoration-blue-500/30 underline-offset-8">BritCRM is the interface.</span></h2>
            <div className="columns-1 md:columns-2 gap-12 space-y-12 py-12">
              <p className="text-zinc-400 font-medium leading-relaxed">
                The era of spreadsheets, lost emails, and manual data entry is over. A modern CRM should work as hard as your team — connecting every customer interaction into a single source of truth.
              </p>
              <p className="text-zinc-400 font-medium leading-relaxed italic border-l-2 border-blue-500 pl-8">
 BritCRM was built on the belief that your CRM shouldn't just store data — it should help you close deals. Smart pipelines, unified inbox, and AI insights that actually save you time.
              </p>
              <p className="text-zinc-400 font-medium leading-relaxed">
                We replaced the complexity of traditional CRMs with a clean, intuitive experience. Import your contacts, build your pipeline, and let the automation handle the rest.
              </p>
              <p className="text-zinc-400 font-medium leading-relaxed">
                Join thousands of teams who stopped fighting their CRM and started closing more deals.
              </p>
            </div>
          </div>
        </section>

        {/* Integrations Section */}
        <section className="container mx-auto px-6 py-40 space-y-24">
          <div className="bg-white/5 border border-white/10 rounded-[60px] p-16 md:p-32 flex flex-col md:flex-row items-center gap-20 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#012169]/10 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
            <div className="flex-1 space-y-10 relative z-10">
              <h2 className="text-5xl font-black tracking-tighter text-white leading-none italic">Plays well with <br /> <span className="text-[#012169] not-italic">everything.</span></h2>
              <p className="text-lg text-zinc-400 font-medium leading-relaxed max-w-sm">
 Sync BritCRM with your existing tools. Import contacts, log emails, and keep your workflow seamless.
              </p>
              <div className="flex gap-4">
                {["Gmail", "Outlook", "Slack", "HubSpot", "Zapier"].map(i => (
                  <div key={i} className="px-4 py-2 rounded-full bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-300">{i}</div>
                ))}
              </div>
            </div>
            <div className="flex-1 grid grid-cols-3 gap-6 opacity-20 hover:opacity-100 transition-opacity duration-1000">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="aspect-square bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center">
                  <Share2 className="w-8 h-8 text-zinc-700" />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. The Roadmap (Future Projections) */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5">
          <div className="text-center space-y-6 mb-24">
            <h2 className="text-5xl md:text-8xl font-black text-white italic tracking-tighter uppercase">The Horizon.</h2>
            <p className="text-xl text-zinc-500 font-medium italic">What's next for the platform.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {[
              { phase: "Q2 2026", title: "Advanced Reporting", desc: "Custom dashboards and exportable reports for pipeline health, team performance, and revenue forecasting." },
              { phase: "Q3 2026", title: "Mobile CRM App", desc: "Full CRM experience on iOS and Android — manage deals, contacts, and tasks on the go." },
              { phase: "Q4 2026", title: "AI Deal Coach", desc: "An AI assistant that analyzes your pipeline and suggests next actions, risk flags, and optimization tips." }
            ].map((item, i) => (
              <div key={i} className="p-10 rounded-[48px] bg-white/5 border border-white/10 space-y-6 group hover:bg-[#012169]/10 transition-all duration-500">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-[#012169] italic">{item.phase}</span>
                <h4 className="text-2xl font-black text-white italic tracking-tight">{item.title}</h4>
                <p className="text-zinc-500 text-sm font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5">
          <div className="text-center space-y-6 mb-24">
            <h2 className="text-5xl md:text-[100px] font-black tracking-tighter text-white uppercase italic">The Verdict.</h2>
            <p className="text-xl text-zinc-500 max-w-2xl mx-auto font-medium tracking-tight">Don't take our word for it. Listen to the teams who made the switch.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
  quote: "BritCRM unified our entire sales process. We went from 6 different tools to one platform. Our close rate doubled in two months.",
                author: "Sarah Chen",
                role: "VP of Sales, TechFlow",
                image: "SC"
              },
              { 
                quote: "Finally, a CRM that actually makes sense. The unified inbox and pipeline view saved us hours every single day.",
                author: "Marcus Rodriguez",
                role: "Founder, ScaleOps",
                image: "MR"
              },
              { 
                quote: "We tried HubSpot, Salesforce, and Pipedrive. BritCRM is the first CRM our team actually wanted to use every day.",
                author: "Elena Rossi",
                role: "Head of Growth, Nexa",
                image: "ER"
              }
            ].map((t, i) => (
              <div key={i} className="p-10 rounded-[40px] bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-all duration-500 space-y-8 relative group">
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-blue-500 text-[#012169]" />)}
                </div>
                <p className="text-lg text-zinc-300 font-medium leading-relaxed italic">"{t.quote}"</p>
                <div className="flex items-center gap-4 pt-4">
                  <div className="w-12 h-12 rounded-full bg-[#012169] flex items-center justify-center text-white font-black italic">
                    {t.image}
                  </div>
                  <div>
                    <h5 className="font-bold text-white">{t.author}</h5>
                    <p className="text-zinc-500 text-xs font-black uppercase tracking-widest">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing Architecture */}
        <section id="pricing" className="container mx-auto px-6 py-40 space-y-32">
          <div className="text-center space-y-6">
            <h2 className="text-5xl md:text-8xl font-black tracking-tighter text-white uppercase italic">The Economics.</h2>
            <p className="text-xl text-zinc-500 max-w-2xl mx-auto font-medium tracking-tight">Choose the plan that fits your team. Upgrade anytime.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                slug: "personal",
                name: "Personal",
                price: "$79",
                seats: "2 seats",
                best: false,
                features: [
                  "50,000 Contacts",
                  "Unified Email Inbox",
                  "Pipeline Deal Tracking",
                  "Contact Timeline",
                  "Task Automation",
                  "Team Collaboration",
                  "Email Sync (Gmail/Outlook)",
                ],
              },
              {
                slug: "business",
                name: "Business",
                price: "$149",
                seats: "5 seats",
                best: true,
                features: [
                  "Everything in Personal",
                  "5 Team Members",
                  "Advanced Pipeline Views",
                  "AI-Powered Insights",
                  "Custom Stages & Fields",
                  "Activity Dashboard",
                  "Priority Support",
                ],
              },
              {
                slug: "enterprise",
                name: "Enterprise",
                price: "Custom",
                seats: "Unlimited",
                best: false,
                features: [
                  "Everything in Business",
                  "Unlimited Team Members",
                  "SSO & SAML",
                  "Custom Integrations",
                  "Dedicated Success Manager",
                  "SLA Guarantee",
                  "24/7 Phone Support",
                ],
              },
            ].map((p) => (
              <div
                key={p.slug}
                className={`p-10 rounded-[40px] flex flex-col justify-between relative overflow-hidden ${
                  p.best
                    ? "bg-[#012169] text-white shadow-[0_40px_100px_-20px_rgba(79,70,229,0.6)] scale-105"
                    : "bg-white/5 border border-white/10"
                }`}
              >
                {p.best && (
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Sparkles className="w-32 h-32 rotate-12" />
                  </div>
                )}
                <div className="space-y-8 relative z-10">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className={`text-2xl font-black italic ${p.best ? "text-white" : ""}`}>{p.name}</h3>
                      <p className={`text-[10px] font-black uppercase tracking-widest mt-1 ${p.best ? "text-blue-200" : "text-zinc-500"}`}>{p.seats}</p>
                    </div>
                    {p.best && (
                      <span className="text-[8px] font-black uppercase tracking-[0.3em] bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-md">Best Value</span>
                    )}
                  </div>
                  <div className="flex items-end gap-1">
                    <span className={`text-5xl font-black ${p.best ? "text-white" : ""}`}>{p.price}</span>
                    {p.price !== "Custom" && (
                      <span className={`font-bold mb-2 text-sm ${p.best ? "text-blue-200" : "text-zinc-400"}`}>/mo</span>
                    )}
                  </div>
                  <div className={`h-px ${p.best ? "bg-white/20" : "bg-white/10"}`} />
                  <ul className="space-y-4">
                    {p.features.map((f) => (
                      <li key={f} className={`flex items-center gap-3 text-[13px] font-bold ${p.best ? "text-white" : "text-zinc-300"}`}>
                        <CheckCircle2 className={`w-4 h-4 shrink-0 ${p.best ? "text-white" : "text-[#012169]"}`} /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
                <Link
                  href={p.slug === "enterprise" ? "mailto:sales@britsyncai.com" : "/signup"}
                  className={`w-full mt-10 py-5 rounded-[20px] text-center font-black uppercase tracking-[0.2em] text-[10px] transition-all ${
                    p.best
                      ? "bg-white text-[#012169] hover:scale-95 shadow-2xl"
                      : "bg-[#012169] text-white hover:bg-[#012169]/90"
                  }`}
                >
                  {p.slug === "enterprise" ? "Contact Sales" : "Start Free Trial"}
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5">
          <div className="grid lg:grid-cols-2 gap-20">
            <div className="space-y-10">
              <h2 className="text-5xl md:text-7xl font-black tracking-tighter text-white leading-none italic">Common <br /> <span className="text-[#012169] not-italic">Questions.</span></h2>
              <p className="text-xl text-zinc-400 font-medium leading-relaxed max-w-sm">
                Everything you need to know about the platform and our philosophy.
              </p>
              <Link href="/contact" className="inline-flex items-center gap-4 text-blue-300 font-black uppercase tracking-widest text-xs group">
                Still have questions? <ArrowRight className="w-4 h-4 group-hover:translate-x-2 transition-transform" />
              </Link>
            </div>
            <div className="space-y-6">
              {[
                { q: "Can I sync my existing Gmail or Outlook accounts?", a: "Yes. BritCRM connects with Gmail, Outlook, and any IMAP account. Your emails sync in real-time, both ways." },
                { q: "Can I import my existing contacts and deals?", a: "Absolutely. Import from CSV, or sync directly from Gmail contacts. Your data is mapped automatically." },
                { q: "How many team members can I add?", a: "Our Business plan supports up to 5 team members, and Enterprise gives you unlimited seats with full role management." },
                { q: "Is my data secure?", a: "Yes. We use AES-256 encryption, SOC2 Type II compliance, and role-based access control. Your data never leaves our secure infrastructure." }
              ].map((faq, i) => (
                <div key={i} className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-4 group hover:bg-white/[0.07] transition-all">
                  <h4 className="text-xl font-bold text-white flex justify-between items-center italic">
                    {faq.q}
                    <HelpCircle className="w-5 h-5 text-zinc-600 group-hover:text-[#012169] transition-colors" />
                  </h4>
                  <p className="text-zinc-500 font-medium leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* High-Impact CTA */}
        <section className="container mx-auto px-6 py-40">
          <div className="relative overflow-hidden rounded-[80px] bg-zinc-100 dark:bg-zinc-900 px-8 py-32 md:px-32 text-center text-zinc-950 dark:text-white shadow-[0_80px_160px_-20px_rgba(0,0,0,0.8)] border border-white/5">
            <div className="absolute top-0 left-0 w-full h-full opacity-30 pointer-events-none">
              <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[#012169] blur-[180px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-violet-600 blur-[180px] rounded-full -translate-x-1/2 translate-y-1/2"></div>
            </div>
            <div className="relative z-10 space-y-12 max-w-4xl mx-auto">
              <h2 className="text-6xl md:text-[100px] font-black tracking-tighter leading-[0.85] italic">Ready to scale <br /> <span className="not-italic text-[#012169]">beyond limits?</span></h2>
              <p className="text-xl md:text-3xl font-medium text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                The most intelligent CRM platform for modern teams. Stop juggling tools — start closing deals.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-8">
                <Link href="/signup" className="w-full sm:w-auto bg-[#012169] text-white px-16 py-8 rounded-[32px] text-2xl font-black transition-all hover:bg-[#012169] hover:scale-105 shadow-2xl">
                  Start Free Trial
                </Link>
                <Link href="/contact" className="w-full sm:w-auto px-16 py-8 rounded-[32px] text-2xl font-black border border-zinc-200 dark:border-white/10 hover:bg-white/5 transition-all text-[14px] uppercase tracking-widest">
                  Talk to Sales
                </Link>
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-zinc-500">Start 14-day free trial • Cancel anytime • 24/7 Global Support</p>
            </div>
          </div>
        </section>
      </main>

      {/* Elegant Footer */}
      <footer className="bg-[#030303] border-t border-white/5 pt-40 pb-20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-24 mb-32">
            <div className="col-span-2 space-y-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-[#012169] rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20 rotate-3">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
 <span className="text-2xl font-black tracking-tighter italic text-white leading-none">BritCRM</span>
              </div>
              <p className="text-lg text-zinc-500 max-w-sm font-medium leading-relaxed">
                The intelligent CRM platform for modern teams who want to manage relationships and close deals faster.
              </p>
              <div className="flex gap-10">
                {[{ name: "X", href: "https://x.com/britsyncai" }, { name: "In", href: "https://linkedin.com/company/britsyncai" }, { name: "Git", href: "https://github.com/britsyncai" }, { name: "Ds", href: "#" }].map(s => (
                  <Link key={s.name} href={s.href} className="text-zinc-600 hover:text-[#012169] transition-colors text-xs font-black uppercase tracking-widest">{s.name}</Link>
                ))}
              </div>
            </div>
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-[0.3em] mb-10 text-white/30 italic">Solution</h4>
              <ul className="space-y-6 text-sm font-bold text-zinc-500">
                <li><Link href="/features/ai-discovery" className="hover:text-[#012169] transition-colors">AI Pipeline</Link></li>
                <li><Link href="/features/cognitive-writing" className="hover:text-[#012169] transition-colors">Smart Inbox</Link></li>
                <li><Link href="/solutions/enterprise" className="hover:text-[#012169] transition-colors">Enterprise</Link></li>
                <li><Link href="/pricing" className="hover:text-[#012169] transition-colors">Pricing</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-[0.3em] mb-10 text-white/30 italic">Resources</h4>
              <ul className="space-y-6 text-sm font-bold text-zinc-500">
                <li><Link href="https://docs.britsyncai.com" className="hover:text-[#012169] transition-colors">Documentation</Link></li>
                <li><Link href="/features/ai-discovery" className="hover:text-[#012169] transition-colors">CRM Guide</Link></li>
                <li><Link href="https://community.britsyncai.com" className="hover:text-[#012169] transition-colors">Community</Link></li>
                <li><Link href="https://docs.britsyncai.com/api" className="hover:text-[#012169] transition-colors">API Reference</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-[11px] font-black uppercase tracking-[0.3em] mb-10 text-white/30 italic">Legal</h4>
              <ul className="space-y-6 text-sm font-bold text-zinc-500">
                <li><Link href="https://britsyncai.com/privacy" className="hover:text-[#012169] transition-colors">Privacy</Link></li>
                <li><Link href="https://britsyncai.com/terms" className="hover:text-[#012169] transition-colors">Terms</Link></li>
                <li><Link href="https://britsyncai.com/compliance" className="hover:text-[#012169] transition-colors">Compliance</Link></li>
              </ul>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center border-t border-white/5 pt-20 gap-10 text-[10px] font-black uppercase tracking-[0.4em] text-white/20">
 <p>© 2026 BritCRM by BritSync. Crafted for world-class growth.</p>
            <div className="flex gap-16">
              <span className="flex items-center gap-3 italic"><div className="w-2 h-2 rounded-full bg-[#012169] animate-ping"></div> Network Status: Elite</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
