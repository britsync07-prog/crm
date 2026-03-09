"use client";

import { useState, useRef, useEffect } from "react";
import { generateAIEmailTemplate, generateAIEmailHTML, chatWithEmailArchitect } from "@/app/ai-actions";
import { Loader2, Copy, Check, AlertCircle, Code, Eye, Sparkles, Send, Bot, User, Trash2 } from "lucide-react";

type Message = {
  role: "user" | "model";
  content: string;
};

export default function AIEmailGenerator() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", content: "Welcome to the Email Architect Lab. I'm your strategist. Tell me: who are we targeting, and what's our winning offer?" }
  ]);
  const [input, setInput] = useState("");
  const [template, setTemplate] = useState<{ subject: string; body?: string; html?: string } | null>(null);
  const [mode, setTemplateMode] = useState<"text" | "html">("html");
  const [view, setView] = useState<"preview" | "code">("preview");
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || chatLoading) return;
    
    const userMsg: Message = { role: "user", content: input };
    const newMessages: Message[] = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setChatLoading(true);
    
    try {
      const data = await chatWithEmailArchitect(newMessages);
      
      // If AI returned a template, load it
      if (data.template) {
        setTemplate(data.template);
        if (data.template.html) setTemplateMode("html");
      }

      setMessages([...newMessages, { role: "model", content: data.chat }]);
    } catch (e) {
      setError("Strategic link failed. Check your API key.");
    } finally {
      setChatLoading(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    // Combine chat history for context
    const context = messages.map(m => m.content).join("\n");
    try {
      let result;
      if (mode === "html") {
        result = await generateAIEmailHTML(context);
      } else {
        result = await generateAIEmailTemplate(context);
      }
      setTemplate(result);
    } catch (e: any) {
      setError("Architectural failure. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!template) return;
    const textToCopy = mode === "html" ? template.html! : `Subject: ${template.subject}\n\n${template.body}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="grid lg:grid-cols-2 gap-8 h-[800px]">
      {/* Left Pane: Chat Interface */}
      <div className="flex flex-col rounded-[40px] border border-zinc-200 dark:border-white/5 bg-white dark:bg-zinc-950 shadow-2xl overflow-hidden relative group">
        <div className="p-8 border-b border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 animate-pulse">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-black italic tracking-tight text-zinc-900 dark:text-white uppercase">Architect Chat</h2>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping"></div>
                <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest">Strategist Online</p>
              </div>
            </div>
          </div>
          <button 
            onClick={() => setMessages([{ role: "model", content: "Resetting strategy. What's the new objective?" }])}
            className="p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-950/20 text-zinc-400 hover:text-red-500 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${m.role === 'model' ? 'bg-indigo-600 text-white' : 'bg-zinc-100 dark:bg-white/10 text-zinc-500'}`}>
                {m.role === 'model' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div className={`max-w-[80%] p-5 rounded-3xl text-sm font-medium leading-relaxed shadow-sm ${
                m.role === 'model' 
                ? 'bg-zinc-50 dark:bg-white/5 text-zinc-800 dark:text-zinc-200 rounded-tl-none italic' 
                : 'bg-indigo-600 text-white rounded-tr-none'
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {chatLoading && (
            <div className="flex gap-4 animate-pulse">
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
              </div>
              <div className="h-10 w-32 bg-zinc-50 dark:bg-white/5 rounded-3xl"></div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        <div className="p-8 border-t border-zinc-100 dark:border-white/5 bg-zinc-50 dark:bg-white/5">
          <div className="relative">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Refine the strategy..."
              className="w-full bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 pl-6 pr-14 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none shadow-xl transition-all"
            />
            <button 
              onClick={handleSend}
              className="absolute right-2 top-2 p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-lg"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <div className="mt-6 flex gap-4">
             <div className="flex bg-white dark:bg-black/20 p-1 rounded-xl border border-zinc-200 dark:border-white/5">
                <button 
                  onClick={() => setTemplateMode("text")}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'text' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-700'}`}
                >
                  Text
                </button>
                <button 
                  onClick={() => setTemplateMode("html")}
                  className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'html' ? 'bg-indigo-600 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-700'}`}
                >
                  HTML
                </button>
              </div>
              <button 
                onClick={handleGenerate}
                disabled={loading || messages.length < 2}
                className="flex-1 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black text-[10px] font-black uppercase tracking-widest hover:opacity-90 disabled:opacity-50 transition-all shadow-xl flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Architect Template
              </button>
          </div>
        </div>
      </div>

      {/* Right Pane: Results Preview */}
      <div className="flex flex-col rounded-[40px] border border-zinc-200 dark:border-white/5 bg-zinc-50 dark:bg-black shadow-inner overflow-hidden">
        {!template ? (
          <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-6 opacity-30 grayscale">
            <div className="w-24 h-24 rounded-[40px] bg-zinc-200 dark:bg-white/10 flex items-center justify-center">
              <Sparkles className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-black uppercase italic italic">Finalize Strategy</h3>
              <p className="text-sm font-medium max-w-xs">Chat with the agent on the left to unlock the blueprint generator.</p>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col animate-in fade-in zoom-in-95 duration-700">
            <div className="p-8 border-b border-zinc-200 dark:border-white/5 flex items-center justify-between bg-white dark:bg-zinc-900">
               <div>
                  <h3 className="text-lg font-black uppercase italic text-indigo-500">Design Artifact</h3>
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Version 1.0.0 Alpha</p>
               </div>
               <div className="flex items-center gap-3">
                  {mode === "html" && (
                    <div className="flex bg-zinc-100 dark:bg-black/20 p-1 rounded-xl border border-zinc-200 dark:border-white/5 mr-4">
                      <button onClick={() => setView("preview")} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase flex items-center gap-1.5 transition-all ${view === 'preview' ? 'bg-white dark:bg-white/10 text-indigo-500 shadow-sm' : 'text-zinc-500'}`}>
                        <Eye className="w-3 h-3" /> Preview
                      </button>
                      <button onClick={() => setView("code")} className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase flex items-center gap-1.5 transition-all ${view === 'code' ? 'bg-white dark:bg-white/10 text-indigo-500 shadow-sm' : 'text-zinc-500'}`}>
                        <Code className="w-3 h-3" /> Code
                      </button>
                    </div>
                  )}
                  <button 
                    onClick={handleCopy}
                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-indigo-600 text-white px-6 py-2.5 rounded-full shadow-lg shadow-indigo-500/30 hover:scale-105 transition-all active:scale-95"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? "Copied" : "Extract Asset"}
                  </button>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-12 space-y-10">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] italic">Subject Line</label>
                <p className="text-2xl font-black text-zinc-900 dark:text-white leading-tight">{template.subject}</p>
              </div>

              {mode === "text" ? (
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] italic">Narrative Body</label>
                  <pre className="text-base text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed bg-white dark:bg-zinc-900 p-10 rounded-[40px] border border-zinc-200 dark:border-white/5 shadow-2xl">
                    {template.body}
                  </pre>
                </div>
              ) : (
                <div className="space-y-6">
                   <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.3em] italic">
                     {view === 'preview' ? 'Visual Rendering' : 'Source Protocol'}
                   </label>
                   <div className="rounded-[40px] border border-zinc-200 dark:border-white/10 overflow-hidden bg-white shadow-2xl">
                      {view === "preview" ? (
                        <iframe 
                          srcDoc={template.html} 
                          className="w-full h-[600px]"
                          title="Email Preview"
                        />
                      ) : (
                        <pre className="text-[11px] text-indigo-400 bg-zinc-900 p-10 font-mono leading-relaxed h-[600px] overflow-y-auto scrollbar-hide">
                          {template.html}
                        </pre>
                      )}
                   </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-red-500 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500 z-50">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
    </div>
  );
}
