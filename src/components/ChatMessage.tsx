import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { Message } from '../types';
import { 
  Bot, User, FileText, Sparkles, Copy, Minimize2, 
  Terminal, Check, ChevronDown, ChevronRight, HardDrive, FileCode, ChevronUp, Download, CheckCircle2, XCircle, Eye, EyeOff, RefreshCw, RotateCcw, Globe
} from 'lucide-react';

interface ChatMessageProps {
  message: Message;
}

// Helper to format execution duration in ms or s
function formatDuration(ms?: number): string {
  if (!ms) return '94ms';
  if (ms >= 1000) {
    const sec = ms / 1000;
    return sec % 1 === 0 ? `${sec}s` : `${sec.toFixed(1)}s`;
  }
  return `${Math.round(ms)}ms`;
}

// Bulletproof Copy to Clipboard for all environments (HTTP, HTTPS, Termux, Mobile WebViews)
function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text)
      .then(() => true)
      .catch(() => fallbackCopy(text));
  } else {
    return Promise.resolve(fallbackCopy(text));
  }
}

function fallbackCopy(text: string): boolean {
  try {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-999999px";
    textArea.style.top = "-999999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error("Fallback copy failed:", err);
    return false;
  }
}

// CodeBlock matching Image 2 & Image 4 with Line Numbers, Copy & Download buttons
function CodeBlock({ language, value, filename }: { language: string; value: string; filename?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const extMap: Record<string, string> = {
      typescript: 'ts',
      ts: 'ts',
      tsx: 'tsx',
      javascript: 'js',
      js: 'js',
      jsx: 'jsx',
      python: 'py',
      py: 'py',
      bash: 'sh',
      sh: 'sh',
      json: 'json',
      html: 'html',
      css: 'css'
    };
    const cleanLang = (language || '').toLowerCase().trim();
    const ext = extMap[cleanLang] || 'txt';
    const name = filename || `script.${ext}`;
    const blob = new Blob([value], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
  };

  const lines = value.split('\n');

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl my-3 overflow-hidden shadow-2xl font-mono text-xs">
      {/* Code Header Bar matching Image 2 */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900/90 border-b border-slate-800 select-none">
        <div className="flex items-center gap-2 min-w-0">
          <FileCode size={15} className="text-indigo-400 flex-shrink-0" />
          <span className="text-[11px] font-bold text-indigo-200 uppercase tracking-wider truncate">
            {filename || (language ? `${language} snippet` : 'code')}
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700/60 text-slate-300 text-[10px] font-bold uppercase tracking-wider mr-1">
            {language ? language.toUpperCase() : 'TXT'}
          </span>
          <button 
            type="button"
            onClick={handleCopy} 
            className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 rounded-lg transition-colors cursor-pointer flex items-center justify-center border border-slate-700/50 bg-slate-950/60"
            title={copied ? "Copied!" : "Copy code"}
          >
            {copied ? <Check size={13} className="text-emerald-400 font-bold" /> : <Copy size={13} />}
          </button>
          <button 
            type="button"
            onClick={handleDownload} 
            className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-indigo-300 rounded-lg transition-colors cursor-pointer flex items-center justify-center border border-slate-700/50 bg-slate-950/60"
            title="Download script"
          >
            <Download size={13} />
          </button>
        </div>
      </div>

      {/* Code Body with Line Numbers matching Image 2 */}
      <div className="flex overflow-x-auto leading-relaxed select-text bg-slate-950 max-h-96">
        {/* Line Numbers Column */}
        <div className="py-3 px-2.5 bg-slate-900/40 text-slate-600 text-[11px] font-mono select-none text-right border-r border-slate-800/80 flex flex-col min-w-[2.5rem]">
          {lines.map((_, i) => (
            <span key={i} className="leading-5">{i + 1}</span>
          ))}
        </div>
        {/* Code Lines */}
        <pre className="p-3 text-xs font-mono text-slate-100 leading-5 overflow-x-auto flex-1 bg-slate-950">
          <code>{value}</code>
        </pre>
      </div>
    </div>
  );
}

// Diff Card view matching Image 1 (`</> rocagents/src/App.tsx   +1 -1`)
function FileDiffCard({ filename, content }: { filename: string; content: string }) {
  const shortFilename = filename.split('/').pop() || filename;
  const lines = content.split('\n');
  const addedLines = lines.filter(l => l.startsWith('+') || !l.startsWith('-')).length;
  const removedLines = lines.filter(l => l.startsWith('-')).length;

  return (
    <div className="bg-slate-950 border border-slate-800/90 rounded-2xl my-2.5 overflow-hidden shadow-2xl font-mono text-xs animate-fade-in">
      {/* Header matching Image 1: </> rocagents/src/App.tsx   +1 -1 */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/90 border-b border-slate-800/80">
        <div className="flex items-center gap-2 truncate pr-2">
          <FileCode size={15} className="text-slate-400 flex-shrink-0" />
          <span className="font-semibold text-slate-200 truncate">{filename}</span>
        </div>
        <div className="flex items-center gap-2 font-bold text-[11px] flex-shrink-0">
          <span className="text-emerald-400">+{addedLines || 1}</span>
          <span className="text-red-400">-{removedLines || 1}</span>
        </div>
      </div>

      {/* Diff Code Container */}
      <div className="p-3 bg-slate-950/90 font-mono text-xs leading-relaxed overflow-x-auto max-h-72">
        {lines.map((line, idx) => {
          const isAdded = line.startsWith('+');
          const isRemoved = line.startsWith('-');

          return (
            <div 
              key={idx} 
              className={`flex items-start gap-3 px-2 py-0.5 rounded ${
                isRemoved ? 'bg-red-950/30 text-red-300' : isAdded ? 'bg-emerald-950/30 text-emerald-300' : 'text-slate-200'
              }`}
            >
              <span className="select-none text-slate-600 text-[10px] w-4 text-right">{idx + 1}</span>
              <span className="select-none text-slate-500 font-bold">{isRemoved ? '-' : isAdded ? '+' : ' '}</span>
              <span className="whitespace-pre-wrap flex-1">{line.replace(/^[+-]/, '')}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Single Execution Tool Card matching Latest Screenshots
function ExecutionCard({ log }: { log: any }) {
  // Default to collapsed / HIDE mode as requested by user
  const [expanded, setExpanded] = useState(false);

  const isWriteFile = log.toolName === 'write_project_file' || log.toolName === 'create_file';
  const isReadFile = log.toolName === 'read_project_file' || log.toolName === 'read_file';
  const isBash = log.toolName === 'run_bash_command' || log.toolName === 'shell';

  const filename = log.args?.filename || log.args?.path || 'file';
  const shortFilename = filename.split('/').pop() || filename;
  const content = log.args?.content || (log.result?.content ? log.result.content : '');
  const command = log.args?.command || log.args?.cmd || '';
  const exitCode = log.result?.exitCode !== undefined ? log.result.exitCode : (log.result?.status === 'error' ? 2 : 0);
  const isError = exitCode !== 0 || log.result?.status === 'error';
  const durationStr = formatDuration(log.timeMs);

  return (
    <div className="space-y-1.5 font-mono text-xs select-none">
      {/* Step Header Bar matching Screenshots: used Bash ❌ exit 2 110ms ^ or used Bash ✓ 2.3s v */}
      <div 
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between py-1.5 px-2.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 rounded-lg text-slate-300 text-xs cursor-pointer select-none transition-colors"
      >
        <div className="flex items-center gap-2 truncate pr-2">
          {isBash ? (
            <>
              <span className="p-0.5 rounded bg-slate-950 border border-slate-800 text-slate-400">
                <Terminal size={12} className={isError ? "text-red-400" : "text-emerald-400"} />
              </span>
              <span className="font-semibold text-slate-200">used Bash</span>
              {isError ? (
                <span className="flex items-center gap-1 text-red-400 text-[11px] font-bold">
                  <XCircle size={13} />
                  <span>exit {exitCode}</span>
                </span>
              ) : (
                <CheckCircle2 size={13} className="text-emerald-400 font-bold" />
              )}
              <span className="text-[11px] text-slate-500 font-sans">{durationStr}</span>
            </>
          ) : isReadFile ? (
            <>
              <Eye size={13} className="text-indigo-400" />
              <span className="text-slate-400">Read</span>
              <span className="font-semibold text-slate-200">{shortFilename}</span>
            </>
          ) : isWriteFile ? (
            <>
              <span className="text-indigo-400 font-bold">Edit</span>
              <span className="text-slate-300 font-mono truncate px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800">{filename}</span>
            </>
          ) : (
            <>
              <FileCode size={13} className="text-indigo-400" />
              <span className="font-semibold text-slate-200">{log.toolName}</span>
            </>
          )}
        </div>

        <button type="button" className="text-slate-400 hover:text-slate-200 p-0.5 flex-shrink-0 flex items-center gap-1">
          {expanded ? (
            <>
              <Eye size={13} className="text-indigo-400" />
              <ChevronUp size={14} />
            </>
          ) : (
            <>
              <EyeOff size={13} className="text-slate-500" />
              <ChevronDown size={14} />
            </>
          )}
        </button>
      </div>

      {/* If tool call is actively running in real-time (no result returned yet) */}
      {!log.result && (
        <div className="flex items-center justify-between py-2 px-3 bg-slate-900/90 border border-amber-500/50 rounded-xl text-amber-300 text-xs animate-pulse shadow-md my-1.5">
          <div className="flex items-center gap-2 truncate pr-2">
            <Terminal size={14} className="animate-spin text-amber-400 flex-shrink-0" />
            <span className="font-bold">Running {log.toolName}...</span>
            {command && <span className="text-slate-300 font-mono truncate text-[11px]">$ {command}</span>}
          </div>
          <span className="text-[10px] font-mono bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30 text-amber-200 font-bold flex-shrink-0">RUNNING ⚡</span>
        </div>
      )}

      {/* Expanded Step Body with COMMAND and STDERR/STDOUT boxes matching Image 2 */}
      {expanded && log.result && (
        <div className="pl-3 border-l-2 border-indigo-500/30 space-y-2 py-1">
          {/* COMMAND Box with Top-Right Copy Button */}
          {command && (
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 font-mono text-xs my-2">
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 border-b border-slate-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                <span>COMMAND</span>
                <button
                  type="button"
                  onClick={() => {
                    copyToClipboard(command);
                    alert("Command copied to clipboard!");
                  }}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                  title="Copy command"
                >
                  <Copy size={12} />
                </button>
              </div>
              <pre className="p-3 text-[11px] text-slate-200 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                <span className="text-emerald-400 font-bold">$ </span>
                <span>{command}</span>
              </pre>
            </div>
          )}

          {/* Read File Content Box */}
          {isReadFile && log.result?.content && (
            <CodeBlock 
              language={filename.split('.').pop() || 'txt'} 
              value={log.result.content} 
              filename={filename} 
            />
          )}

          {/* List Project Files Box */}
          {log.toolName === 'list_project_files' && log.result?.files && (
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 font-mono text-xs my-2 p-3 space-y-2">
              <div className="flex items-center justify-between text-indigo-300 font-bold text-[11px] border-b border-slate-800 pb-1.5">
                <span>📂 Workspace Files ({log.result.files.length} items)</span>
                <span className="text-slate-500 font-normal">ROOT WORKSPACE</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-60 overflow-y-auto pt-1">
                {log.result.files.map((file: string, idx: number) => (
                  <div key={idx} className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-900/80 border border-slate-800/80 text-slate-200 text-[11px]">
                    <FileCode size={13} className="text-indigo-400 flex-shrink-0" />
                    <span className="truncate">{file}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search Codebase Results Box */}
          {log.toolName === 'search_codebase' && log.result?.results && (
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 font-mono text-xs my-2 p-3 space-y-2">
              <div className="text-indigo-300 font-bold text-[11px] border-b border-slate-800 pb-1.5">
                🔍 Codebase Search Matches ({log.result.results.length} results)
              </div>
              <div className="space-y-1.5 max-h-60 overflow-y-auto pt-1">
                {log.result.results.map((item: any, idx: number) => (
                  <div key={idx} className="p-2 bg-slate-900/80 border border-slate-800 rounded-lg text-[11px]">
                    <div className="flex items-center justify-between text-indigo-400 font-bold mb-1">
                      <span>{item.filename}:{item.line}</span>
                    </div>
                    <code className="text-slate-300 block bg-slate-950 p-1.5 rounded border border-slate-800/60 font-mono text-[10px] overflow-x-auto">
                      {item.match}
                    </code>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isWriteFile && content && (
            <FileDiffCard filename={filename} content={content} />
          )}

          {/* STDOUT Box with Top-Right Copy Button */}
          {log.result?.stdout && !content && (
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 font-mono text-xs my-2">
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 border-b border-slate-800 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                <span>STDOUT</span>
                <button
                  type="button"
                  onClick={() => {
                    copyToClipboard(log.result.stdout);
                    alert("STDOUT copied to clipboard!");
                  }}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                  title="Copy stdout"
                >
                  <Copy size={12} />
                </button>
              </div>
              <pre className="p-3 text-[11px] font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-48">
                {log.result.stdout}
              </pre>
            </div>
          )}

          {/* STDERR Box with Top-Right Copy Button matching Image 2 */}
          {log.result?.stderr && (
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 font-mono text-xs my-2">
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 border-b border-slate-800 text-[10px] font-bold text-red-400 uppercase tracking-wider">
                <span>STDERR</span>
                <button
                  type="button"
                  onClick={() => {
                    copyToClipboard(log.result.stderr);
                    alert("STDERR copied to clipboard!");
                  }}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                  title="Copy stderr"
                >
                  <Copy size={12} />
                </button>
              </div>
              <pre className="p-3 text-[11px] font-mono text-red-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-48">
                {log.result.stderr}
              </pre>
            </div>
          )}

          {/* Generic JSON / Tool Result Message fallback */}
          {!isBash && !isWriteFile && !isReadFile && log.toolName !== 'list_project_files' && log.toolName !== 'search_codebase' && log.result && (
            <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950 font-mono text-xs my-2">
              <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 border-b border-slate-800 text-[10px] font-bold text-indigo-300 uppercase tracking-wider">
                <span>TOOL RESULT</span>
                <button
                  type="button"
                  onClick={() => {
                    copyToClipboard(JSON.stringify(log.result, null, 2));
                    alert("Result copied to clipboard!");
                  }}
                  className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                  title="Copy result JSON"
                >
                  <Copy size={12} />
                </button>
              </div>
              <pre className="p-3 text-[11px] text-slate-200 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-48">
                {typeof log.result === 'string' ? log.result : JSON.stringify(log.result, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Collapsible Group Container matching Screenshots 1 & 2
function ExecutionLogsGroup({ logs }: { logs: any[] }) {
  // Default all summary groups to HIDE / COLLAPSED mode as requested by user
  const [ranCommandsExpanded, setRanCommandsExpanded] = useState(false);
  const [exploredReadsExpanded, setExploredReadsExpanded] = useState(false);
  const [editedFilesExpanded, setEditedFilesExpanded] = useState(false);

  if (!Array.isArray(logs) || logs.length === 0) return null;

  const bashLogs = logs.filter(l => l && (l.toolName === 'run_bash_command' || l.toolName === 'shell'));
  const readLogs = logs.filter(l => l && (l.toolName === 'read_project_file' || l.toolName === 'read_file'));
  const editLogs = logs.filter(l => l && (l.toolName === 'write_project_file' || l.toolName === 'create_file'));
  const otherLogs = logs.filter(l => l && !bashLogs.includes(l) && !readLogs.includes(l) && !editLogs.includes(l));

  return (
    <div className="mt-3 space-y-2.5 font-mono text-xs animate-fade-in select-none">
      {/* Group 1: Explored N reads / Exploring N reads */}
      {readLogs.length > 0 && (
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/80 shadow-md">
          <div 
            onClick={() => setExploredReadsExpanded(!exploredReadsExpanded)}
            className="flex items-center justify-between p-2 px-3 bg-slate-900/80 text-slate-300 hover:text-white cursor-pointer text-xs"
          >
            <div className="flex items-center gap-2">
              <ChevronRight size={13} className={`transition-transform ${exploredReadsExpanded ? 'rotate-90 text-indigo-400' : 'text-slate-500'}`} />
              <Eye size={14} className="text-indigo-400" />
              <span className="font-bold text-slate-200">Explored {readLogs.length} read{readLogs.length > 1 ? 's' : ''}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
              {exploredReadsExpanded ? (
                <>
                  <Eye size={12} className="text-indigo-400" />
                  <span>Minimize ▲</span>
                </>
              ) : (
                <>
                  <EyeOff size={12} className="text-slate-500" />
                  <span>Expand ▼</span>
                </>
              )}
            </div>
          </div>

          {exploredReadsExpanded && (
            <div className="p-2 space-y-2 bg-slate-950">
              {readLogs.map((log, i) => (
                <ExecutionCard key={i} log={log} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Group 2: Edited files N / Editing files N */}
      {editLogs.length > 0 && (
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/80 shadow-md">
          <div 
            onClick={() => setEditedFilesExpanded(!editedFilesExpanded)}
            className="flex items-center justify-between p-2 px-3 bg-slate-900/80 text-slate-300 hover:text-white cursor-pointer text-xs"
          >
            <div className="flex items-center gap-2">
              <ChevronRight size={13} className={`transition-transform ${editedFilesExpanded ? 'rotate-90 text-indigo-400' : 'text-slate-500'}`} />
              <FileCode size={14} className="text-indigo-400" />
              <span className="font-bold text-slate-200">Edited files {editLogs.length}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
              {editedFilesExpanded ? (
                <>
                  <Eye size={12} className="text-indigo-400" />
                  <span>Minimize ▲</span>
                </>
              ) : (
                <>
                  <EyeOff size={12} className="text-slate-500" />
                  <span>Expand ▼</span>
                </>
              )}
            </div>
          </div>

          {editedFilesExpanded && (
            <div className="p-2 space-y-2 bg-slate-950">
              {editLogs.map((log, i) => (
                <ExecutionCard key={i} log={log} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Group 3: Ran commands N / Running commands N */}
      {bashLogs.length > 0 && (
        <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-950/80 shadow-md">
          <div 
            onClick={() => setRanCommandsExpanded(!ranCommandsExpanded)}
            className="flex items-center justify-between p-2 px-3 bg-slate-900/80 text-slate-300 hover:text-white cursor-pointer text-xs"
          >
            <div className="flex items-center gap-2">
              <ChevronRight size={13} className={`transition-transform ${ranCommandsExpanded ? 'rotate-90 text-indigo-400' : 'text-slate-500'}`} />
              <Terminal size={14} className="text-indigo-400" />
              <span className="font-bold text-slate-200">Ran commands {bashLogs.length}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono">
              {ranCommandsExpanded ? (
                <>
                  <Eye size={12} className="text-indigo-400" />
                  <span>Minimize ▲</span>
                </>
              ) : (
                <>
                  <EyeOff size={12} className="text-slate-500" />
                  <span>Expand ▼</span>
                </>
              )}
            </div>
          </div>

          {ranCommandsExpanded && (
            <div className="p-2 space-y-2 bg-slate-950">
              {bashLogs.map((log, i) => (
                <ExecutionCard key={i} log={log} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Remaining other tool logs */}
      {otherLogs.length > 0 && (
        <div className="p-2 space-y-2">
          {otherLogs.map((log, i) => (
            <ExecutionCard key={i} log={log} />
          ))}
        </div>
      )}
    </div>
  );
}

// Exclusive Array Function Reasoning + Turbo Proxy Running Indicator
function KvProgressMeter({ statusMessage }: { statusMessage?: string }) {
  const [pct, setPct] = useState(15);
  const [activeFn, setActiveFn] = useState(0);
  const functions = [
    { name: "Thinking", icon: "🧠", color: "text-indigo-400", bg: "bg-indigo-500/15 border-indigo-500/30 text-indigo-300", desc: "Internal chain-of-thought & plan" },
    { name: "Observation", icon: "👁️", color: "text-cyan-400", bg: "bg-cyan-500/15 border-cyan-500/30 text-cyan-300", desc: "Reading files, logs, .env & keys" },
    { name: "Grounding", icon: "⚓", color: "text-amber-400", bg: "bg-amber-500/15 border-amber-500/30 text-amber-300", desc: "Verifying tools & system status" },
    { name: "Hacking", icon: "💻", color: "text-emerald-400", bg: "bg-emerald-500/15 border-emerald-500/30 text-emerald-300", desc: "Executing tools & applying fixes" },
    { name: "Viewing", icon: "🖥️", color: "text-purple-400", bg: "bg-purple-500/15 border-purple-500/30 text-purple-300", desc: "Rendering final output response" },
  ];

  React.useEffect(() => {
    const interval = setInterval(() => {
      setPct(prev => (prev >= 98 ? 98 : prev + Math.floor(Math.random() * 12) + 6));
    }, 280);
    const fnInterval = setInterval(() => {
      setActiveFn(prev => (prev + 1) % functions.length);
    }, 900);
    return () => { clearInterval(interval); clearInterval(fnInterval); };
  }, []);

  const current = functions[activeFn];

  return (
    <div className="mt-2.5 p-3.5 bg-slate-950/90 backdrop-blur-md border border-slate-800/80 rounded-2xl space-y-3 font-mono text-xs select-none shadow-xl text-left transition-all">
      {/* Header & Integrated Progress Bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-bold text-slate-100 tracking-wider text-[11px] truncate">TURBO PROXY</span>
          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            FASTCACHE 0ms
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-20 bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
            <div className="bg-emerald-400 h-full rounded-full transition-all duration-300" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-[10px] font-bold text-emerald-400 min-w-[28px] text-right">{pct}%</span>
        </div>
      </div>

      {/* Simplified 5-Step Reasoning Pipeline */}
      <div className="grid grid-cols-5 gap-1.5 py-1">
        {functions.map((fn, idx) => {
          const isActive = idx === activeFn;
          return (
            <div
              key={fn.name}
              className={`px-2 py-1.5 rounded-lg border text-[10px] transition-all flex items-center justify-center gap-1 cursor-default ${
                isActive
                  ? `${fn.bg} font-bold shadow-sm scale-[1.02]`
                  : 'bg-slate-900/40 border-slate-800/60 text-slate-500 opacity-60'
              }`}
            >
              <span className="text-[11px]">{fn.icon}</span>
              <span className="hidden sm:inline text-[9px] tracking-tight">{fn.name}</span>
            </div>
          );
        })}
      </div>

      {/* Active Step Details */}
      <div className={`p-2.5 rounded-xl border flex items-center gap-2.5 transition-all ${current.bg}`}>
        <span className="text-sm">{current.icon}</span>
        <div className="flex-1 min-w-0 text-[10px]">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className={`font-bold uppercase tracking-wider text-[10px] ${current.color}`}>{current.name}</span>
            <span className="text-slate-500 text-[9px]">[{activeFn + 1}/5]</span>
            <span className="text-slate-300 font-medium truncate">
              {statusMessage || current.desc}
            </span>
          </div>
        </div>
        <Terminal size={13} className={`animate-spin flex-shrink-0 ${current.color}`} />
      </div>

      {/* Minimal Footer */}
      <div className="flex items-center justify-between text-[9px] text-slate-500 pt-0.5 px-0.5">
        <span>TermOnePlus • Terminal logs di chat</span>
        <span>Port 8022 ubuntu</span>
      </div>
    </div>
  );
}

// Interactive Clarification Option Poll Card matching Video 00:25 - 00:39
function ClarificationPollCard({ text }: { text?: string }) {
  const [submitted, setSubmitted] = useState(true);
  const [selectedOption, setSelectedOption] = useState(0);
  const [customText, setCustomText] = useState('');

  const options = [
    {
      title: "Review Bug/Performa Loop (Coding)",
      desc: "Membahas review teknis pada kode perulangan (mencari bug seperti infinite loop, off-by-one, atau masalah performa)."
    },
    {
      title: "Feedback Loop (Bisnis & Produk)",
      desc: "Membahas konsep bisnis atau manajemen (seperti siklus feedback dari pengguna untuk pengembangan produk)."
    },
    {
      title: "Proses Review Kode (Workflow Dev)",
      desc: "Membahas siklus proses review kode tim developer sebelum merge (Pull Request, revisi, approval)."
    }
  ];

  if (submitted) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 my-3 text-slate-200 text-xs shadow-lg space-y-2 font-sans animate-fade-in select-none">
        <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Summary</div>
        <div className="text-slate-300 font-medium">
          Apa yang Anda maksud dengan &quot;review loop&quot;? Silakan pilih opsi yang paling sesuai:
        </div>
        <div className="flex items-center gap-2 text-emerald-400 font-semibold pt-1 bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-900/40">
          <Check size={14} className="text-emerald-400 flex-shrink-0" />
          <span>{options[selectedOption].title}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 my-3 text-slate-200 text-xs shadow-xl space-y-3 font-sans animate-fade-in">
      <div className="flex items-start justify-between gap-2">
        <div className="font-semibold text-slate-100 leading-snug text-xs sm:text-sm">
          Apa yang Anda maksud dengan &quot;review loop&quot;? Silakan pilih opsi yang paling sesuai:
        </div>
        <button
          type="button"
          onClick={() => setSubmitted(true)}
          className="text-indigo-400 hover:text-indigo-300 text-xs font-semibold cursor-pointer flex-shrink-0"
        >
          Skip &rarr;
        </button>
      </div>

      <div className="space-y-2 pt-1">
        {options.map((opt, idx) => {
          const isSelected = selectedOption === idx;
          return (
            <div
              key={idx}
              onClick={() => setSelectedOption(idx)}
              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                isSelected
                  ? 'bg-indigo-950/50 border-indigo-500/80 text-white shadow-md'
                  : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
              }`}
            >
              <div className="mt-0.5 flex-shrink-0">
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  isSelected ? 'border-indigo-400 bg-indigo-600' : 'border-slate-600'
                }`}>
                  {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                </div>
              </div>
              <div className="space-y-1 min-w-0 flex-1">
                <div className="font-bold text-xs text-slate-100">{opt.title}</div>
                <div className="text-[11px] text-slate-400 leading-relaxed">{opt.desc}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-2 pt-1">
        <input
          type="text"
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          placeholder="✎ Revise options or write your own..."
          className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
        />
        <button
          type="button"
          onClick={() => setSubmitted(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-md transition-colors cursor-pointer flex-shrink-0"
        >
          Submit
        </button>
      </div>
    </div>
  );
}

// Module WebSearching 4-Stage Cognitive Card
function WebSearchingModuleCard() {
  const [activeStage, setActiveStage] = useState<'all' | 'analisa' | 'pemahaman' | 'kesimpulan' | 'penerapan'>('all');

  return (
    <div className="bg-slate-900 border border-indigo-900/60 rounded-2xl p-4 my-3 text-slate-200 text-xs shadow-xl space-y-3 font-sans animate-fade-in border-l-4 border-l-cyan-500">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950 border border-cyan-800/80 text-cyan-400">
            <Globe size={16} className="animate-spin-slow" />
          </div>
          <div>
            <div className="font-bold text-slate-100 text-xs sm:text-sm flex items-center gap-2">
              <span>Peningkatan Module WebSearching</span>
              <span className="text-[9px] bg-cyan-500/20 text-cyan-300 font-mono font-bold px-1.5 py-0.5 rounded border border-cyan-500/30">
                4-TAHAP
              </span>
            </div>
            <div className="text-[10px] text-slate-400">Multi-engine live search &amp; non-monotonous AI reasoning framework</div>
          </div>
        </div>
      </div>

      {/* Stage Navigation Pills */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <button
          type="button"
          onClick={() => setActiveStage('all')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-all ${
            activeStage === 'all'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          🌐 Semua Tahap
        </button>
        <button
          type="button"
          onClick={() => setActiveStage('analisa')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-all ${
            activeStage === 'analisa'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          🔍 1. Analisa
        </button>
        <button
          type="button"
          onClick={() => setActiveStage('pemahaman')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-all ${
            activeStage === 'pemahaman'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          💡 2. Pemahaman
        </button>
        <button
          type="button"
          onClick={() => setActiveStage('kesimpulan')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-all ${
            activeStage === 'kesimpulan'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          🎯 3. Kesimpulan
        </button>
        <button
          type="button"
          onClick={() => setActiveStage('penerapan')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer transition-all ${
            activeStage === 'penerapan'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          🚀 4. Penerapan
        </button>
      </div>
    </div>
  );
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [copiedMessage, setCopiedMessage] = useState(false);

  // Copy Chat Message Handler matching Image 3 & Frame 028
  const handleCopyMessage = async () => {
    if (message.text) {
      await copyToClipboard(message.text);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2000);
    }
  };

  return (
    <div className={`flex w-full mb-5 group animate-fade-in ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex w-full max-w-4xl items-start min-w-0 ${isUser ? 'text-right' : 'text-left'}`}>
        {/* Message Bubble Container (Without Avatar Icons for Maximum Width) */}
        <div className={`flex flex-col gap-2 flex-1 min-w-0 text-slate-100 p-3.5 sm:p-4.5 rounded-2xl shadow-lg relative ${
          isUser ? 'bg-indigo-950/60 border border-indigo-800/80' : 'bg-slate-900/40 border border-slate-800/80'
        }`}>
          
          {/* Header row in Chat Message Box with Copy Chat Button matching Frame 028 */}
          <div className={`flex items-center justify-between border-b border-slate-800/80 pb-2 mb-1 select-none ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-200">
                {isUser ? 'Ivan Ssl (ivansslo)' : 'RoC Workspace Orchestrator'}
              </span>
              {!isUser && (
                <span className="text-[9px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-1.5 py-0.5 rounded uppercase">
                  PRO AI
                </span>
              )}
            </div>

            {/* Top Right Actions Bar: Copy Chat Icon Only */}
            <div className="flex items-center gap-1.5">
              {message.text && (
                <button
                  type="button"
                  onClick={handleCopyMessage}
                  className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 border border-slate-700/60 transition-all cursor-pointer shadow-xs flex items-center justify-center"
                  title={copiedMessage ? "Teks chat berhasil disalin!" : "Salin pesan"}
                >
                  {copiedMessage ? (
                    <Check size={14} className="text-emerald-400 font-bold" />
                  ) : (
                    <Copy size={14} />
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Uploaded Attachments */}
          {message.image && (
            <div className="relative w-full rounded-xl overflow-hidden bg-slate-900 border border-slate-800">
              <img
                src={message.image.url}
                alt="Uploaded attachment"
                className="w-full max-h-80 object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          )}

          {message.file && (
            <div className="flex items-center gap-2.5 p-2.5 px-3 bg-slate-900/90 border border-slate-800 rounded-xl mb-1 max-w-md shadow-sm">
              <div className="p-2 bg-indigo-600/10 text-indigo-400 rounded-lg flex-shrink-0">
                <FileText size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-100 truncate">{message.file.name}</p>
                <p className="text-[10px] text-slate-400 font-mono">
                  {message.file.savedToWorkspace ? '📂 Saved to Workspace' : '📎 Attached Context'}
                </p>
              </div>
            </div>
          )}

          {/* Render ClarificationPollCard for review loop queries */}
          {!isUser && message.text && (message.text.toLowerCase().includes("review loop") || message.text.toLowerCase().includes("review_loop")) && (
            <ClarificationPollCard text={message.text} />
          )}

          {/* Render WebSearchingModuleCard for websearching queries */}
          {!isUser && message.text && (message.text.toLowerCase().includes("websearching") || message.text.toLowerCase().includes("analisa kognitif") || message.text.toLowerCase().includes("4-tahap")) && (
            <WebSearchingModuleCard />
          )}

          {/* High-Contrast Markdown Text Body */}
          {message.text && (
            <div className="prose prose-invert prose-sm sm:prose-base max-w-none text-slate-100 break-words leading-relaxed">
              <Markdown
                components={{
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    return match ? (
                      <CodeBlock language={match[1]} value={String(children).replace(/\n$/, '')} />
                    ) : (
                      <code className="bg-slate-950 text-indigo-300 font-mono text-xs px-1.5 py-0.5 rounded border border-slate-800 font-semibold" {...props}>
                        {children}
                      </code>
                    );
                  }
                }}
              >
                {message.text}
              </Markdown>
            </div>
          )}

          {/* Execution Output Group matching Screenshots 1..6 */}
          {message.logs && message.logs.length > 0 && (
            <ExecutionLogsGroup logs={message.logs} />
          )}

          {/* KV Progress Bar & Live Execution Loading Indicator matching Screenshot 1:1 */}
          {message.isTyping && (
            <KvProgressMeter statusMessage={message.statusMessage} />
          )}
        </div>
      </div>
    </div>
  );
}
