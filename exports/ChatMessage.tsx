import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { Message } from '../src/types';
import { 
  Bot, User, FileText, Sparkles, Copy, Minimize2, 
  Terminal, Check, ChevronDown, ChevronRight, HardDrive, FileCode, ChevronUp, Download, CheckCircle2, XCircle, Eye, EyeOff, RefreshCw, RotateCcw
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

// CodeBlock matching Image 2 & Image 4 with Line Numbers, Copy & Download buttons
function CodeBlock({ language, value, filename }: { language: string; value: string; filename?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
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
            className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-emerald-400 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] border border-slate-700/50 bg-slate-950/60"
            title="Copy script"
          >
            {copied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
            <span className="hidden sm:inline">{copied ? 'Copied!' : 'Copy'}</span>
          </button>
          <button 
            type="button"
            onClick={handleDownload} 
            className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-indigo-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-[11px] border border-slate-700/50 bg-slate-950/60"
            title="Download script"
          >
            <Download size={13} />
            <span className="hidden sm:inline">Download</span>
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
                    navigator.clipboard.writeText(command);
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
                    navigator.clipboard.writeText(log.result.stdout);
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
                    navigator.clipboard.writeText(log.result.stderr);
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
                    navigator.clipboard.writeText(JSON.stringify(log.result, null, 2));
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

// Animated KV Progress Meter Component
function KvProgressMeter({ statusMessage }: { statusMessage?: string }) {
  const [pct, setPct] = useState(15);

  React.useEffect(() => {
    const interval = setInterval(() => {
      setPct(prev => {
        if (prev >= 98) return 98;
        return prev + Math.floor(Math.random() * 12) + 6;
      });
    }, 280);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="mt-2.5 p-3 bg-slate-950 border border-slate-800 rounded-2xl space-y-2.5 font-mono text-xs select-none shadow-2xl animate-fade-in text-left">
      <div className="flex items-center gap-2 text-slate-200">
        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border border-emerald-300 flex-shrink-0 animate-ping" />
        <span className="font-bold text-slate-100 flex-shrink-0">KV</span>
        <span className="text-slate-500 font-bold flex-shrink-0">[</span>
        
        {/* Animated fill progress bar moving left to right towards 100% */}
        <div className="flex-1 bg-slate-900 h-3.5 rounded p-0.5 border border-slate-800 relative overflow-hidden">
          <div 
            className="bg-emerald-400 h-full rounded-xs transition-all duration-300 ease-out shadow-md shadow-emerald-500/50"
            style={{ width: `${pct}%` }}
          />
        </div>

        <span className="text-slate-500 font-bold flex-shrink-0">]</span>
        <span className="text-indigo-300 font-bold flex-shrink-0 font-mono min-w-[2.8rem] text-right">{pct}%</span>
      </div>

      <div className="flex items-center gap-2 text-emerald-400 text-xs font-mono bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 animate-pulse shadow-sm">
        <Terminal size={15} className="animate-spin text-emerald-400 flex-shrink-0" />
        <div className="flex items-center gap-1.5 truncate">
          <span className="text-amber-300 font-bold flex-shrink-0">⚡ Live Execution:</span>
          <span className="text-slate-200 truncate font-semibold">{statusMessage || "asking Bradley..."}</span>
        </div>
      </div>
    </div>
  );
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [copiedMessage, setCopiedMessage] = useState(false);

  // Copy Chat Message Handler matching Image 3 & Frame 028
  const handleCopyMessage = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text);
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
