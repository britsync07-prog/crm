import Link from "next/link";
import { 
  MessageCircle, 
  Sparkles, 
  ArrowRight, 
  Bot, 
  Cpu, 
  Zap, 
  TrendingUp,
  Brain,
  History,
  ShieldCheck,
  Globe,
  Languages,
  MousePointer2,
  Share2,
  CheckCircle2,
  FileText
} from "lucide-react";

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="text-zinc-400 hover:text-white transition-colors duration-300 font-medium tracking-tight">
    {children}
  </Link>
);

export default function CognitiveSDRPage() {
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
          <span className="text-blue-300 text-[10px] font-black uppercase tracking-[0.4em] italic">Generative Outreach Agents</span>
          <h1 className="text-6xl md:text-9xl font-black tracking-tighter leading-[0.85] text-white">
            Cognitive <br /> <span className="text-[#012169] italic">Conversations.</span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed font-medium">
            Our AI agents don't just write templates. They architect psychological narratives tailored to every individual prospect in your pipeline.
          </p>
        </section>

        {/* 1. Psychological Frameworks */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5">
          <div className="text-center space-y-6 mb-24">
            <h2 className="text-5xl font-black tracking-tighter text-white italic uppercase">The Core Frameworks.</h2>
            <p className="text-zinc-500 max-w-xl mx-auto font-medium">Pre-trained on elite sales performance data.</p>
          </div>
          <div className="grid md:grid-cols-4 gap-8">
            {[
              { label: "AIDA", desc: "Attention, Interest, Desire, Action. The gold standard for cold traffic." },
              { label: "PAS", desc: "Problem, Agitation, Solution. Designed for high-urgency pain points." },
              { label: "BAB", desc: "Before, After, Bridge. Visualizing the transformation for the client." },
              { label: "4Ps", desc: "Promise, Picture, Proof, Push. Foundation for enterprise trust." }
            ].map((f, i) => (
              <div key={i} className="p-8 rounded-[32px] bg-white/5 border border-white/10 space-y-4 hover:bg-white/[0.08] transition-all">
                <h4 className="text-2xl font-black text-[#012169] italic">{f.label}</h4>
                <p className="text-zinc-500 text-sm font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 2. Sentiment Analysis Breakdown */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5 bg-white/[0.01]">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-10">
              <h2 className="text-5xl font-black tracking-tighter text-white italic">Sentiment <br /> <span className="text-[#012169] not-italic">Synchronicity.</span></h2>
              <p className="text-lg text-zinc-400 font-medium leading-relaxed">
                Our agents detect micro-intent in replies. Are they curious? Skeptical? Out of office? The agent routes the response through a custom neural path for the next follow-up.
              </p>
              <div className="flex gap-4">
                <div className="px-4 py-2 rounded-xl bg-[#012169]/10 border border-blue-500/20 text-[#012169] text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <TrendingUp className="w-3 h-3" /> Intent Detection
                </div>
                <div className="px-4 py-2 rounded-xl bg-green-500/10 border border-green-500/20 text-green-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 className="w-3 h-3" /> Objection Handling
                </div>
              </div>
            </div>
            <div className="p-10 bg-black border border-white/10 rounded-[60px] space-y-6 shadow-2xl">
               <div className="flex justify-between items-center border-b border-white/5 pb-6">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic">Reply Analysis Terminal</span>
                  <span className="text-[#012169] font-black text-[10px]">AI PROCESSING...</span>
               </div>
               <div className="space-y-4">
                  <p className="text-xs text-zinc-500 border-l-2 border-blue-500 pl-4 py-2 italic">"Thanks for reaching out, but we just signed a contract with Salesforce last month."</p>
                  <div className="p-4 rounded-2xl bg-[#012169]/10 border border-blue-500/20 text-blue-300 text-[10px] font-black uppercase leading-relaxed">
                    DETECTION: SOFT OBJECTION / LEGACY LOCK-IN<br />
                    STRATEGY: ARCHITECT COMPLEMENTARY VALUE / Q4 FOLLOW-UP
                  </div>
               </div>
            </div>
          </div>
        </section>

        {/* 3. Multi-Language Intelligence */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5">
          <div className="max-w-4xl mx-auto text-center space-y-12">
            <h2 className="text-5xl font-black text-white italic tracking-tighter leading-none">Global Fluency. <br /> <span className="text-[#012169] not-italic">Localized Nuance.</span></h2>
            <p className="text-xl text-zinc-400 font-medium">Agents translate not just words, but business culture across 30+ languages.</p>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-8 pt-12">
               {["EN", "ES", "FR", "DE", "JP", "ZH", "IT", "PT", "NL", "RU", "KO", "AR"].map(lang => (
                 <div key={lang} className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-black text-xs text-zinc-500 hover:text-white hover:border-[#012169] transition-all cursor-default">{lang}</div>
               ))}
            </div>
          </div>
        </section>

        {/* 4. Agent Personalization Matrix */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5 bg-white/[0.01]">
          <div className="grid lg:grid-cols-2 gap-32 items-center">
            <div className="relative aspect-square rounded-[80px] bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
               <Sparkles className="w-48 h-48 text-[#012169]/10 animate-pulse" />
               <div className="absolute inset-0 flex items-center justify-center p-12">
                  <div className="space-y-4 w-full">
                     {[1, 2, 3].map(i => (
                       <div key={i} className="h-12 bg-white/5 border border-white/5 rounded-2xl flex items-center px-6 gap-4">
                          <div className="w-2 h-2 rounded-full bg-[#012169]"></div>
                          <div className="h-2 w-full bg-zinc-800 rounded-full"></div>
                       </div>
                     ))}
                  </div>
               </div>
            </div>
            <div className="space-y-10 text-left">
              <h2 className="text-5xl font-black tracking-tighter text-white italic">Dynamic <br /> <span className="text-[#012169] not-italic">Personalization.</span></h2>
              <p className="text-xl text-zinc-400 font-medium leading-relaxed">
                Beyond static variables. Our agents inject specific details from the prospect's latest keynote, blog post, or financial quarterly report into the first paragraph.
              </p>
              <div className="space-y-4">
                 <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#012169]" />
                    <span className="font-bold text-zinc-300 uppercase text-xs tracking-widest">Company Mission Sync</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#012169]" />
                    <span className="font-bold text-zinc-300 uppercase text-xs tracking-widest">Recent Achievement Hook</span>
                 </div>
                 <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-[#012169]" />
                    <span className="font-bold text-zinc-300 uppercase text-xs tracking-widest">Pain-Point Prediction</span>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Anti-Spam Governance */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5">
          <div className="bg-zinc-900 rounded-[60px] p-16 md:p-32 border border-white/5 relative overflow-hidden text-center space-y-12">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-red-600/5 blur-[150px] rounded-full"></div>
            <h2 className="text-5xl md:text-8xl font-black text-white italic tracking-tighter leading-none relative z-10">Ghost the <br /> <span className="text-red-500 not-italic">Spam Filter.</span></h2>
            <p className="text-xl text-zinc-400 max-w-2xl mx-auto relative z-10 font-medium">
              Our agents generate unique syntax for every single email sent. No two prospects ever receive the same fingerprint, making your outreach invisible to global spam detection algorithms.
            </p>
            <div className="flex flex-wrap justify-center gap-12 relative z-10 opacity-40">
              {["SYNTAX ROTATION", "SMTP WARMUP", "DKIM/SPF VERIFIED", "DMARC ACTIVE"].map(s => (
                <span key={s} className="text-[10px] font-black uppercase tracking-[0.4em] text-white">{s}</span>
              ))}
            </div>
          </div>
        </section>

        {/* 6. A/B Testing Lab UI */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5 bg-white/[0.01]">
          <div className="text-center space-y-12">
            <h2 className="text-5xl font-black tracking-tighter text-white italic uppercase">The Testing Lab.</h2>
            <div className="grid lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
               <div className="p-10 rounded-[40px] bg-white/5 border border-white/10 space-y-6 text-left">
                  <span className="px-3 py-1 rounded-full bg-[#012169]/20 text-blue-300 text-[10px] font-black">VARIANT A</span>
                  <h4 className="text-xl font-bold text-white italic">Aggressive / Direct</h4>
                  <p className="text-zinc-500 text-sm">Focus on ROI and immediate cost-savings.</p>
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden mt-8">
                     <div className="h-full bg-[#012169] w-[42%] shadow-[0_0_15px_rgba(79,70,229,0.5)]"></div>
                  </div>
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">42% Reply Rate</p>
               </div>
               <div className="p-10 rounded-[40px] bg-white/5 border border-white/10 space-y-6 text-left">
                  <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-black">VARIANT B</span>
                  <h4 className="text-xl font-bold text-white italic">Empathetic / Long-term</h4>
                  <p className="text-zinc-500 text-sm">Focus on partnership and strategic alignment.</p>
                  <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden mt-8">
                     <div className="h-full bg-emerald-500 w-[68%] shadow-[0_0_15px_rgba(16,185,129,0.5)]"></div>
                  </div>
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">68% Reply Rate (Winner)</p>
               </div>
            </div>
          </div>
        </section>

        {/* 7. Narrative Sequencing */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5">
          <div className="max-w-4xl mx-auto text-center space-y-16">
            <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase">The Sequence Logic.</h2>
            <div className="grid md:grid-cols-3 gap-12">
               {[
                 { step: "01", title: "The Disruptor", desc: "Brief, high-impact hook regarding a specific industry shift." },
                 { step: "02", title: "The Evidence", desc: "Social proof or case study link tied to variant performance." },
                 { step: "03", title: "The Ultima", desc: "A soft-close or 'breakup' email that often yields the highest intent." }
               ].map((step, i) => (
                 <div key={i} className="space-y-4">
                    <p className="text-4xl font-black text-[#012169]/30 italic">{step.step}</p>
                    <h4 className="font-bold text-white uppercase italic tracking-widest text-sm">{step.title}</h4>
                    <p className="text-zinc-500 text-xs font-medium leading-relaxed">{step.desc}</p>
                 </div>
               ))}
            </div>
          </div>
        </section>

        {/* 8. Cognitive SDR FAQ */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5 bg-white/[0.01]">
          <div className="max-w-3xl mx-auto space-y-12">
            <h2 className="text-4xl font-black text-white italic tracking-tighter text-center uppercase">Outreach FAQ.</h2>
            <div className="space-y-6">
              {[
                { q: "Is the content truly unique?", a: "Yes. Every sentence is generated in real-time. We don't use static templates with variables; we use cognitive narrative paths." },
                { q: "Can I review before sending?", a: "Absolutely. You can set 'Approval Mode' for any agent, or let them operate in 'Autonomous Strike' mode for high-volume list validation." },
                { q: "How many agents can I deploy?", a: "Unlimited on Elite plans. Each agent can handle approximately 500 personalized interactions per day across channels." }
              ].map((faq, i) => (
                <div key={i} className="p-10 rounded-[40px] bg-white/5 border border-white/10 space-y-4 hover:bg-white/[0.08] transition-all">
                  <h4 className="text-xl font-bold text-white italic">{faq.q}</h4>
                  <p className="text-zinc-500 text-sm font-medium leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="container mx-auto px-6 py-40 text-center space-y-12 border-t border-white/5">
          <h3 className="text-4xl md:text-8xl font-black text-white italic tracking-tighter leading-none">Ready to <br /> <span className="text-[#012169] not-italic underline underline-offset-8">automate the human?</span></h3>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 pt-12">
            <Link href="/signup" className="group bg-[#012169] text-white px-16 py-8 rounded-[32px] text-2xl font-black transition-all hover:bg-[#012169] shadow-2xl hover:scale-105 flex items-center gap-4">
              Deploy Agent <ArrowRight className="w-6 h-6" />
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
 <p className="text-zinc-500 text-xs font-black tracking-[0.4em]">© 2026 BritCRM by BritSync. Precision outreach at scale.</p>
        </div>
      </footer>
    </div>
  );
}
