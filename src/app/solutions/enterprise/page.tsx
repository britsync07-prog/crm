import Link from "next/link";
import { 
  Shield, 
  Sparkles, 
  Lock, 
  EyeOff, 
  Server, 
  Globe, 
  CheckCircle2, 
  FileCheck,
  ShieldCheck,
  Zap,
  Activity,
  History,
  Fingerprint,
  Users,
  ShieldAlert,
  Database,
  Key,
  Briefcase
} from "lucide-react";

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <Link href={href} className="text-zinc-400 hover:text-white transition-colors duration-300 font-medium tracking-tight">
    {children}
  </Link>
);

export default function EnterpriseShieldPage() {
  return (
    <div className="flex flex-col min-h-screen bg-[#030303] text-zinc-100 overflow-x-hidden selection:bg-indigo-500 selection:text-white font-sans antialiased">
      {/* Immersive Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-indigo-600/10 blur-[160px] rounded-full"></div>
        <div className="absolute bottom-[10%] right-[-5%] w-[40%] h-[40%] bg-violet-600/10 blur-[140px] rounded-full"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
      </div>

      {/* Glass Navbar */}
      <header className="fixed top-0 w-full z-50 px-6 py-6 flex justify-center">
        <div className="max-w-6xl w-full h-16 bg-white/5 border border-white/10 backdrop-blur-xl rounded-full px-8 flex items-center justify-between shadow-2xl">
          <Link href="/landing" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20 rotate-3">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase italic text-white hidden sm:block">MiniCRM</span>
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
            <Link href="/signup" className="bg-white text-black px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-[0.1em] hover:bg-indigo-500 hover:text-white transition-all duration-500 shadow-xl">
              Join Now
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 relative z-10 pt-48 pb-32">
        {/* Hero Section */}
        <section className="container mx-auto px-6 text-center space-y-12 max-w-6xl">
          <span className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em] italic">Enterprise Governance & Security</span>
          <h1 className="text-6xl md:text-9xl font-black tracking-tighter leading-[0.85] text-white">
            Elite <br /> <span className="text-indigo-500 italic">Protection.</span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto leading-relaxed font-medium">
            Your revenue engine is only as strong as its foundation. We provide military-grade security for global hyper-growth teams.
          </p>
        </section>

        {/* 1. Security Pillars */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="p-12 rounded-[60px] bg-white/5 border border-white/10 space-y-8 relative overflow-hidden group hover:border-indigo-500/50 transition-all">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-600/10 blur-[100px]"></div>
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 flex items-center justify-center text-indigo-400">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div className="space-y-4">
                <h3 className="text-3xl font-black italic uppercase tracking-tight text-white">Zero Trust <br /> Architecture.</h3>
                <p className="text-zinc-500 font-medium leading-relaxed">
                  Every request, every agent action, and every database query is verified. No implicit trust, even within the network perimeter.
                </p>
              </div>
            </div>
            <div className="p-12 rounded-[60px] bg-white/5 border border-white/10 space-y-8 relative overflow-hidden group hover:border-emerald-500/50 transition-all">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-600/10 blur-[100px]"></div>
              <div className="w-16 h-16 rounded-2xl bg-emerald-600/20 flex items-center justify-center text-emerald-400">
                <FileCheck className="w-8 h-8" />
              </div>
              <div className="space-y-4">
                <h3 className="text-3xl font-black italic uppercase tracking-tight text-white">Global <br /> Compliance.</h3>
                <p className="text-zinc-500 font-medium leading-relaxed">
                  SOC2 Type II, GDPR, HIPAA, and CCPA compliant. We handle the complexity of global data residency so you don't have to.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Identity & SSO */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5 bg-white/[0.01]">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-10">
              <h2 className="text-5xl font-black tracking-tighter text-white italic">Identity <br /> <span className="text-indigo-500 not-italic">Orchestration.</span></h2>
              <p className="text-lg text-zinc-400 font-medium leading-relaxed">
                Connect your existing identity provider (Okta, Azure AD, Auth0) in minutes. Enforce MFA across your entire revenue team with a single toggle.
              </p>
              <div className="flex flex-wrap gap-4 opacity-40">
                {["OIDC", "SAML 2.0", "SCIM", "OAuth"].map(auth => (
                  <span key={auth} className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-zinc-300">{auth}</span>
                ))}
              </div>
            </div>
            <div className="relative">
               <div className="p-10 bg-zinc-900 border border-white/5 rounded-[40px] shadow-2xl space-y-6">
                  <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                     <Fingerprint className="w-6 h-6 text-indigo-500" />
                     <span className="text-sm font-bold text-white uppercase italic tracking-widest">Biometric Verification Active</span>
                  </div>
                  <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                     <div className="h-full bg-indigo-600 w-3/4 animate-pulse"></div>
                  </div>
               </div>
            </div>
          </div>
        </section>

        {/* 3. Real-time Audit Logs */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5">
          <div className="max-w-4xl mx-auto space-y-12 text-center">
            <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase">Total Visibility.</h2>
            <p className="text-xl text-zinc-500 font-medium italic">Every action is logged. Every change is tracked.</p>
            <div className="mt-12 overflow-hidden rounded-[40px] border border-white/10 bg-white/5 text-left shadow-2xl">
               <div className="p-8 space-y-4 font-mono text-[10px] text-zinc-500 uppercase tracking-widest leading-relaxed">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                     <span>2026-03-04 10:42:12</span>
                     <span>User: admin_root</span>
                     <span className="text-indigo-400">Action: API_KEY_ROTATED</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                     <span>2026-03-04 10:41:05</span>
                     <span>User: agent_bot_42</span>
                     <span className="text-emerald-400">Action: LEAD_ENRICHMENT_SUCCESS</span>
                  </div>
                  <div className="flex justify-between">
                     <span>2026-03-04 10:38:22</span>
                     <span>User: manager_sales</span>
                     <span className="text-amber-400">Action: WORKSPACE_LIMIT_MODIFIED</span>
                  </div>
               </div>
            </div>
          </div>
        </section>

        {/* 4. API Security & Rate Limiting */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5 bg-white/[0.01]">
          <div className="grid lg:grid-cols-2 gap-32 items-center">
            <div className="order-2 lg:order-1 relative aspect-square rounded-[80px] bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
               <Activity className="w-48 h-48 text-indigo-500/10" />
               <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-40 h-40 rounded-full border-2 border-indigo-500/20 flex items-center justify-center animate-ping">
                     <Lock className="w-8 h-8 text-indigo-500" />
                  </div>
               </div>
            </div>
            <div className="order-1 lg:order-2 space-y-10 text-left">
              <h2 className="text-5xl font-black tracking-tighter text-white italic">Hardened <br /> <span className="text-indigo-500 not-italic">Endpoints.</span></h2>
              <p className="text-xl text-zinc-400 font-medium leading-relaxed">
                Our public and private APIs are protected by enterprise-grade rate limiting and anomaly detection. We block 99.9% of malicious bot traffic before it ever hits your data layer.
              </p>
              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-2">
                    <p className="text-2xl font-black text-white">40ms</p>
                    <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Global API Latency</p>
                 </div>
                 <div className="space-y-2 border-l border-white/10 pl-6">
                    <p className="text-2xl font-black text-white">Infinite</p>
                    <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest">Concurrent Scaling</p>
                 </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Custom Data Residency */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5">
          <div className="bg-indigo-600 rounded-[60px] p-16 md:p-32 text-center space-y-12 relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10"></div>
            <h2 className="text-5xl md:text-8xl font-black text-white italic tracking-tighter leading-none relative z-10">Local Roots. <br /> Global Grid.</h2>
            <p className="text-xl text-indigo-100 max-w-2xl mx-auto relative z-10 font-medium leading-relaxed">
              Require your data to stay within the EU, US, or APAC? Our multi-region residency layer ensures your database never leaves your jurisdiction.
            </p>
            <div className="flex flex-wrap justify-center gap-12 relative z-10 opacity-60">
              {["US-EAST-1", "EU-CENTRAL-1", "AP-SOUTHEAST-1", "LOCAL ISOLATION"].map(region => (
                <span key={region} className="text-xs font-black uppercase tracking-[0.4em] text-white">{region}</span>
              ))}
            </div>
          </div>
        </section>

        {/* 6. Dedicated Support Tier */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5 bg-white/[0.01]">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-10 text-left">
              <h2 className="text-5xl font-black tracking-tighter text-white italic uppercase">White-Glove <br /> Governance.</h2>
              <p className="text-lg text-zinc-400 font-medium leading-relaxed">
                Enterprise partners receive a dedicated Technical Success Manager and 24/7 priority access to our core engineering team. 
              </p>
              <div className="space-y-4">
                 <div className="flex items-center gap-3 text-zinc-300 font-bold">
                    <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                    <span className="uppercase text-xs tracking-widest">15min Response SLA</span>
                 </div>
                 <div className="flex items-center gap-3 text-zinc-300 font-bold">
                    <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                    <span className="uppercase text-xs tracking-widest">Custom Onboarding Pod</span>
                 </div>
              </div>
            </div>
            <div className="p-12 rounded-[60px] bg-white/5 border border-white/10 space-y-8 backdrop-blur-3xl text-center">
               <Users className="w-16 h-16 text-indigo-500 mx-auto" />
               <h4 className="text-2xl font-black text-white italic tracking-tight">A Strategic Partnership.</h4>
               <p className="text-zinc-500 text-sm">We don't just sell software; we architect your revenue success.</p>
            </div>
          </div>
        </section>

        {/* 7. Backup & Recovery */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5">
          <div className="max-w-4xl mx-auto space-y-16 text-center">
            <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase">Disaster Defiance.</h2>
            <div className="grid md:grid-cols-3 gap-12">
               {[
                 { title: "Point-in-Time", desc: "Rollback to any second in the last 35 days instantly." },
                 { title: "Triple Redundancy", desc: "Data is mirrored across 3 availability zones in real-time." },
                 { title: "Immutable Storage", desc: "WORM protection against accidental or malicious deletion." }
               ].map((item, i) => (
                 <div key={i} className="space-y-4 text-center">
                    <History className="w-8 h-8 text-indigo-500/30 mx-auto mb-4" />
                    <h4 className="font-bold text-white uppercase italic tracking-widest text-sm">{item.title}</h4>
                    <p className="text-zinc-500 text-xs font-medium leading-relaxed">{item.desc}</p>
                 </div>
               ))}
            </div>
          </div>
        </section>

        {/* 8. Enterprise FAQ */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5 bg-white/[0.01]">
          <div className="max-w-3xl mx-auto space-y-12">
            <h2 className="text-4xl font-black text-white italic tracking-tighter text-center uppercase">Enterprise FAQ.</h2>
            <div className="space-y-6 text-left">
              {[
                { q: "Is single-sign-on (SSO) included?", a: "Yes. We support SAML 2.0 and OIDC natively for all enterprise-tier workspaces." },
                { q: "Where is my data stored?", a: "By default, data is stored in AWS US-East-1. However, we offer regional residency options for EU, APAC, and Canada." },
                { q: "Do you offer on-premise deployment?", a: "We offer 'Virtual Private Cloud' (VPC) deployments for elite partners who require total infrastructure control." }
              ].map((faq, i) => (
                <div key={i} className="p-10 rounded-[40px] bg-white/5 border border-white/10 space-y-4 hover:bg-white/[0.08] transition-all">
                  <h4 className="text-xl font-bold text-white italic">{faq.q}</h4>
                  <p className="text-zinc-500 text-sm font-medium leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Technical Grid */}
        <section className="container mx-auto px-6 py-40 border-t border-white/5">
          <div className="max-w-4xl mx-auto text-center space-y-24">
            <h2 className="text-5xl font-black text-white italic tracking-tighter">Hardened Infrastructure.</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
              {[
                { label: "Encryption", val: "AES-256" },
                { label: "Uptime", val: "99.99%" },
                { label: "Isolation", val: "Tenant-Level" },
                { label: "Audit", val: "Real-time" }
              ].map((item, i) => (
                <div key={i} className="space-y-2">
                  <p className="text-4xl font-black text-indigo-500 italic">{item.val}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-[#030303] border-t border-white/5 py-20">
        <div className="container mx-auto px-6 text-center space-y-10">
          <div className="flex items-center justify-center gap-3">
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tighter uppercase italic text-white">MiniCRM</span>
          </div>
          <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.4em]">© 2026 MiniCRM. Security is not an option.</p>
        </div>
      </footer>
    </div>
  );
}
