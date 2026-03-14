import Link from "next/link";
import { 
  Sparkles, 
  ArrowRight, 
  Bot, 
  Cpu, 
  Zap, 
  TrendingUp,
  Brain,
  History,
  Terminal,
  Globe,
  MessageCircle,
  Shield,
  Heart,
  Lightbulb,
  ZapOff,
  UserCheck,
  Code
} from "lucide-react";

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="text-zinc-400 hover:text-white transition-colors duration-300 font-medium tracking-tight">
    {children}
  </Link>
);

export default function ManifestoPage() {
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
          <span className="text-blue-300 text-[10px] font-black uppercase tracking-[0.4em] italic">The Future of Human-AI Synergy</span>
          <h1 className="text-6xl md:text-[120px] font-black tracking-tighter leading-[0.85] text-white">
            Software <br /> <span className="text-[#012169] italic">is dead.</span>
          </h1>
          <p className="text-xl md:text-3xl text-zinc-400 max-w-3xl mx-auto leading-relaxed font-medium">
            We believe the era of manual data entry and clicking buttons is over. The future of business is agentic.
          </p>
        </section>

        {/* 1. Core Beliefs */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5">
          <div className="grid md:grid-cols-2 gap-20">
            <div className="space-y-8">
              <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter leading-tight">The End of <br /> Administrative Debt.</h2>
              <p className="text-zinc-400 font-medium leading-relaxed italic border-l-2 border-blue-500 pl-8">
                CRM was meant to empower sales, not enslave them to a database. We believe every minute a human spends typing data is a failure of architecture.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-8">
               {[
                 { title: "Cognitive First", desc: "AI shouldn't be a feature; it should be the core engine that drives the UI." },
                 { title: "Total Autonomy", desc: "Software should work for you while you sleep, not wait for you to wake up." }
               ].map((item, i) => (
                 <div key={i} className="p-8 rounded-3xl bg-white/5 border border-white/10 space-y-2 hover:bg-white/[0.08] transition-all">
                    <h4 className="font-bold text-white uppercase italic text-sm tracking-widest">{item.title}</h4>
                    <p className="text-zinc-500 text-xs font-medium leading-relaxed">{item.desc}</p>
                 </div>
               ))}
            </div>
          </div>
        </section>

        {/* 2. The Mandate */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5 bg-white/[0.01]">
          <div className="max-w-4xl mx-auto space-y-12 text-center">
            <div className="flex items-center justify-center gap-4 text-[#012169] mb-8">
               <Zap className="w-10 h-10" />
               <h2 className="text-5xl font-black italic tracking-tighter uppercase text-white leading-none">The Mandate.</h2>
            </div>
            <p className="text-2xl md:text-4xl text-zinc-400 leading-tight font-medium italic">
              "We mandate that technology must always provide a 10x return on human time. If a task can be automated by a cognitive agent, it MUST be automated."
            </p>
          </div>
        </section>

        {/* 3. Comparison Grid */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5">
          <div className="grid lg:grid-cols-2 gap-12">
             <div className="p-16 rounded-[60px] border border-white/5 bg-white/5 space-y-10 grayscale opacity-40">
                <div className="flex justify-between items-center">
                   <h4 className="font-black text-zinc-500 uppercase tracking-widest text-xs italic">Legacy Systems (1999-2024)</h4>
                   <ZapOff className="w-6 h-6 text-zinc-600" />
                </div>
                <ul className="space-y-6 text-lg font-medium text-zinc-600">
                   <li>• Manual Record Keeping</li>
                   <li>• Passive Data Entry</li>
                   <li>• Fragmented Toolsets</li>
                   <li>• High Friction Workflows</li>
                </ul>
             </div>
             <div className="p-16 rounded-[60px] border border-blue-700/30 bg-[#012169]/10 space-y-10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-[#012169]/10 blur-[100px]"></div>
                <div className="flex justify-between items-center relative z-10">
 <h4 className="font-black text-blue-300 tracking-widest text-xs italic">The BritCRM Way (The Future)</h4>
                   <Sparkles className="w-6 h-6 text-[#012169]" />
                </div>
                <ul className="space-y-6 text-lg font-bold text-zinc-300 relative z-10">
                   <li>• Zero-Manual Entry</li>
                   <li>• Active Opportunity Sourcing</li>
                   <li>• Unified Cognitive Hub</li>
                   <li>• Programmatic Scale</li>
                </ul>
             </div>
          </div>
        </section>

        {/* 4. Human Direction */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5 bg-white/[0.01]">
          <div className="grid lg:grid-cols-2 gap-32 items-center">
            <div className="space-y-10 text-left">
              <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-tight text-[#012169]">The Human <br /> Director.</h2>
              <p className="text-xl text-zinc-400 font-medium leading-relaxed">
                In the autonomous age, the human role changes from "Worker" to "Director." You define the high-level strategy; the Neural Engine handles the complex execution.
              </p>
              <div className="p-8 rounded-[40px] bg-white/5 border border-white/10 flex items-center gap-6 italic text-zinc-500 text-sm">
                 <UserCheck className="w-8 h-8 text-emerald-500" />
                 "The machine builds the list. You decide who to close."
              </div>
            </div>
            <div className="relative">
               <div className="aspect-video rounded-[60px] bg-[#012169]/10 border border-blue-500/20 flex items-center justify-center shadow-2xl">
                  <Brain className="w-32 h-32 text-[#012169]/20 animate-pulse" />
               </div>
            </div>
          </div>
        </section>

        {/* 5. Workforce Transformation */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5">
          <div className="max-w-4xl mx-auto text-center space-y-12">
            <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase">The New Workforce.</h2>
            <p className="text-2xl text-zinc-500 font-medium leading-relaxed italic">
 We don't see AI as a threat to sales professionals. We see it as the armor that makes them invincible. A single account executive, powered by BritCRM, can perform the work of an entire 10-person agency.
            </p>
          </div>
        </section>

        {/* 6. Algorithmic Integrity */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5 bg-white/[0.01]">
          <div className="bg-zinc-900 rounded-[60px] p-16 md:p-32 border border-white/5 relative overflow-hidden text-center space-y-12">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#012169]/5 blur-[150px] rounded-full"></div>
            <h2 className="text-4xl md:text-7xl font-black text-white italic tracking-tighter uppercase relative z-10 leading-none">Algorithmic <br /> <span className="text-[#012169] not-italic">Integrity.</span></h2>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto relative z-10 font-medium leading-relaxed">
              We are committed to building AI that respects the boundaries of the professional world. No spam, no dark patterns, no hallucinated promises. Only precision data and authentic human-AI synergy.
            </p>
            <div className="flex justify-center gap-16 relative z-10 opacity-20">
               <Heart className="w-12 h-12 text-red-500" />
               <Shield className="w-12 h-12 text-[#012169]" />
               <Globe className="w-12 h-12 text-emerald-500" />
            </div>
          </div>
        </section>

        {/* 7. Code & Ethics */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5">
          <div className="max-w-4xl mx-auto space-y-16">
             <div className="flex items-center gap-4 text-zinc-500">
                <Code className="w-6 h-6" />
                <span className="font-black uppercase tracking-[0.4em] text-xs">Architectural Principles</span>
             </div>
             <div className="grid md:grid-cols-2 gap-12 text-left">
                {[
                  { t: "Open Architecture", d: "We believe in interoperability. Your data should never be held hostage by a platform." },
                  { t: "Agentic Ethics", d: "Agents must always identify as AI when requested and respect 'No Contact' signals instantly." },
                  { t: "Data Ownership", d: "You own every byte of data sourced and every narrative generated. Always." },
                  { t: "Neutral Ground", d: "We build the tools. You define the mission. We maintain the integrity of the engine." }
                ].map((item, i) => (
                  <div key={i} className="space-y-4">
                     <h4 className="font-bold text-white uppercase italic tracking-widest text-sm">{item.t}</h4>
                     <p className="text-zinc-500 text-xs font-medium leading-relaxed">{item.d}</p>
                  </div>
                ))}
             </div>
          </div>
        </section>

        {/* 8. Call to Vanguard */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5">
          <div className="bg-[#012169] rounded-[60px] p-16 md:p-32 text-center space-y-16 shadow-2xl relative overflow-hidden group">
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
            <h2 className="text-5xl md:text-[100px] font-black text-white italic tracking-tighter leading-none relative z-10 group-hover:scale-105 transition-transform duration-1000">Join the <br /> Vanguard.</h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8 relative z-10 pt-12">
              <Link href="/signup" className="group bg-white text-black px-16 py-8 rounded-[32px] text-2xl font-black transition-all hover:scale-105 shadow-2xl flex items-center gap-4">
                Enter the Lab <ArrowRight className="w-6 h-6" />
              </Link>
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
 <p className="text-zinc-500 text-xs font-black tracking-[0.4em]">© 2026 BritCRM by BritSync. Dedicated to the builders.</p>
        </div>
      </footer>
    </div>
  );
}
