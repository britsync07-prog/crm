import Link from "next/link";
import { Bot, CheckCircle2, ExternalLink } from "lucide-react";
import { getAppBaseUrl } from "@/lib/app-url";
import { mcpDocsSections } from "@/lib/mcp-docs";

export const dynamic = "force-dynamic";

function codeBlock(value: unknown) {
  return JSON.stringify(value, null, 2);
}

export default function McpDocsPage() {
  const endpoint = `${getAppBaseUrl()}/api/mcp`;
  const config = {
    mcpServers: {
      britcrm: {
        url: endpoint,
        headers: {
          Authorization: "Bearer bcrm_mcp_your_token_here",
        },
      },
    },
  };

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-10 sm:px-8">
      <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#012169] text-white">
            <Bot className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">BritCRM MCP Docs</h1>
            <p className="mt-2 max-w-3xl text-sm font-medium leading-6 text-zinc-500">
              Direct browser documentation for AI agents using the hosted BritCRM MCP server. This page is one scrollable guide with setup, workflows, tools, and safety rules.
            </p>
          </div>
        </div>
        <Link href="/settings/mcp" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#012169] px-4 py-3 text-sm font-black text-white">
          Open MCP Settings
          <ExternalLink className="h-4 w-4" />
        </Link>
      </header>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
        <h2 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-50">Hosted Config</h2>
        <p className="mt-3 text-sm font-medium leading-6 text-zinc-500">Create a token from MCP Settings, then replace the placeholder token in this config.</p>
        <pre className="mt-5 overflow-auto rounded-xl bg-zinc-950 p-4 text-xs leading-6 text-zinc-100">
          <code>{codeBlock(config)}</code>
        </pre>
      </section>

      <nav className="sticky top-0 z-10 -mx-4 flex gap-2 overflow-x-auto border-y border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95 sm:-mx-8 sm:px-8">
        {mcpDocsSections.map((section) => (
          <a key={section.id} href={`#${section.id}`} className="shrink-0 rounded-xl border border-zinc-200 px-3 py-2 text-xs font-black text-zinc-700 hover:border-[#012169] hover:text-[#012169] dark:border-zinc-800 dark:text-zinc-200">
            {section.title}
          </a>
        ))}
      </nav>

      <section className="space-y-5">
        {mcpDocsSections.map((section) => (
          <article key={section.id} id={section.id} className="scroll-mt-24 rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-950">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-50">{section.title}</h2>
            <p className="mt-2 text-sm font-medium leading-6 text-zinc-500 dark:text-zinc-400">{section.description}</p>
            <div className="mt-5 grid gap-5 lg:grid-cols-2">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Workflow</p>
                <ul className="mt-3 space-y-2 text-sm font-bold text-zinc-600 dark:text-zinc-300">
                  {section.workflow.map((item) => (
                    <li key={item} className="flex gap-2">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Tools</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {section.tools.map((tool) => (
                    <span key={tool} className="rounded-lg bg-zinc-100 px-2.5 py-1.5 font-mono text-[11px] font-bold text-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                      {tool}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
