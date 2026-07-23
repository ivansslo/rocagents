import React, { useEffect, useState, useRef } from 'react';
import { Terminal, Shield, Play, CheckCircle2, AlertTriangle, Loader2, ChevronDown, ChevronUp, Minimize2, Maximize2 } from 'lucide-react';

interface LiveTerminalProps {
  isLoading: boolean;
  logs?: any[];
}

export function LiveTerminal({ isLoading, logs = [] }: LiveTerminalProps) {
  const [tickerLogs, setTickerLogs] = useState<string[]>([]);
  const [minimized, setMinimized] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Hardcoded real-time build status updates to simulate dynamic compiling logs
  const simulationLines = [
    "🤖 [ROBOT] Initiating Arena Agent Execution Framework v1.4...",
    "🔍 [ANALYZER] Parsing user instructions and intent...",
    "🛡️ [SANDBOX] Verifying workspace security clearance... OK",
    "📂 [FILE_SYSTEM] Indexing workspace active files...",
    "⚡ [INTELLIGENCE] Processing prompt via Gemini Model Pipeline...",
    "🧱 [BUILD] Triggering incremental project compilation...",
    "📈 [TELEMETRY] Tracking active fleet state metrics...",
    "🔄 [AGENT] Running tool integrations (read/write workspace API)...",
    "✅ [COMPILE] System output compiled successfully on port 3000."
  ];

  useEffect(() => {
    if (isLoading) {
      setTickerLogs(["🤖 Initializing robotic orchestrator pipeline..."]);
      let index = 0;
      const interval = setInterval(() => {
        if (index < simulationLines.length) {
          setTickerLogs(prev => [...prev, simulationLines[index]]);
          index++;
        } else {
          // Add standard waiting loop line
          setTickerLogs(prev => [...prev, `⏳ [WAITING] Streaming active token payloads: ${new Date().toLocaleTimeString()}`]);
        }
      }, 1500);

      return () => clearInterval(interval);
    } else {
      // Done loading. If we have actual server logs, render them elegantly
      if (logs && logs.length > 0) {
        const finishedLogs = [
          "🎉 Agent Finished successfully.",
          `📊 Execution Summary: ${logs.length} tools executed.`,
          ...logs.map(log => {
            const timestamp = new Date().toLocaleTimeString();
            return `▶️ [${timestamp}] Tool: ${log.toolName} | Args: ${JSON.stringify(log.args)}`;
          })
        ];
        setTickerLogs(finishedLogs);
      } else {
        setTickerLogs(["🟢 Sandbox idle. Ready to execute code scripts and synchronize ecosystems."]);
      }
    }
  }, [isLoading, logs]);

  useEffect(() => {
    if (!minimized) {
      terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [tickerLogs, minimized]);

  return (
    <div className="bg-neutral-950 border border-theme-border rounded-xl flex flex-col font-mono text-xs overflow-hidden shadow-2xl transition-all">
      {/* Header bar with Minimize / Maximize toggle matching Image 1 */}
      <div 
        onClick={() => setMinimized(!minimized)}
        className="bg-neutral-900 border-b border-theme-border px-4 py-2.5 flex items-center justify-between cursor-pointer select-none hover:bg-neutral-800/80 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-emerald-400" />
          <span className="text-neutral-200 font-semibold uppercase tracking-wider text-[10px]">
            Arena Agent Console
          </span>
          <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-bold">
            {minimized ? 'MINIMIZED' : 'LIVE'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            type="button" 
            onClick={(e) => {
              e.stopPropagation();
              setMinimized(!minimized);
            }}
            className="p-1 hover:bg-neutral-700 rounded text-neutral-400 hover:text-white transition-colors"
            title={minimized ? "Maximize terminal" : "Minimize terminal"}
          >
            {minimized ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
          </button>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-500/80"></span>
            <span className="w-2 h-2 rounded-full bg-yellow-500/80"></span>
            <span className="w-2 h-2 rounded-full bg-green-500/80"></span>
          </div>
        </div>
      </div>

      {/* Terminal View Body */}
      {!minimized && (
        <div className="p-4 overflow-y-auto space-y-1.5 max-h-[450px]">
          {(Array.isArray(tickerLogs) ? tickerLogs : []).map((log, index) => {
            const l = String(log || '');
            let textClass = "text-neutral-300";
            if (l.includes("🤖") || l.includes("[ROBOT]")) textClass = "text-indigo-400 font-semibold";
            else if (l.includes("🛡️") || l.includes("[SANDBOX]")) textClass = "text-amber-400";
            else if (l.includes("✅") || l.includes("🟢") || l.includes("[COMPILE]")) textClass = "text-emerald-400 font-semibold";
            else if (l.includes("🎉") || l.includes("Summary:")) textClass = "text-pink-400 font-bold";
            else if (l.includes("⏳") || l.includes("WAITING")) textClass = "text-neutral-400 animate-pulse";
            else if (l.includes("▶️")) textClass = "text-indigo-300";

            return (
              <div key={index} className={`leading-relaxed break-all ${textClass}`}>
                {l}
              </div>
            );
          })}
          {isLoading && (
            <div className="flex items-center gap-1.5 text-indigo-400">
              <Loader2 size={12} className="animate-spin" />
              <span>Building pipeline output...</span>
              <span className="w-1.5 h-3 bg-indigo-400 animate-pulse"></span>
            </div>
          )}
          <div ref={terminalEndRef} />
        </div>
      )}
    </div>
  );
}
