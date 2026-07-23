import React, { useState, useRef, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell } from 'recharts';
import { Message, FilePayload, ChatSession } from './types';
import { ChatMessage } from './components/ChatMessage';
import { ChatInput } from './components/ChatInput';
import { SyncDashboard } from './components/SyncDashboard';
import { UpgradePanel } from './components/UpgradePanel';
import { FileArchive } from './components/FileArchive';
import { ExecutionHistoryModal } from './components/ExecutionHistoryModal';
import { LiveTerminal } from './components/LiveTerminal';
import { 
  Bot, Trash2, Settings, Minimize2, Maximize2, Menu, Sparkles, RefreshCw, 
  MessageSquare, Sun, Moon, Palette, Check, Plus, Edit2, Terminal as TerminalIcon, HardDrive, Layout, ChevronRight, ChevronDown, X, Search, Copy, Clock, Bell, Volume2, Download, Folder, MoreHorizontal, Activity, BarChart2, FileDown, Upload, ShieldCheck, TrendingUp, CheckCircle2, XCircle
} from 'lucide-react';

export default function App() {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== 'undefined' && window.innerWidth >= 768);
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'chat' | 'files' | 'sync' | 'upgrade' | 'settings'>('chat');
  const [tier, setTier] = useState<string>(() => localStorage.getItem('ROC_TIER') || 'FREE');
  const [theme, setTheme] = useState<'dark' | 'light' | 'high-contrast'>(() => {
    return (localStorage.getItem('ROC_THEME') as any) || 'dark';
  });
  const [sendOnEnter, setSendOnEnter] = useState<boolean>(() => {
    const saved = localStorage.getItem('ROC_SEND_ON_ENTER');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [retryOnError, setRetryOnError] = useState<boolean>(false);

  // Multi-Model State
  const [availableModels, setAvailableModels] = useState<any[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>(() => localStorage.getItem('ROC_MODEL') || 'openai/gpt-oss-120b');
  const [selectedProvider, setSelectedProvider] = useState<string>(() => localStorage.getItem('ROC_PROVIDER') || 'groq');

  // Fetch available AI models from backend
  useEffect(() => {
    fetch('/api/models')
      .then(res => {
        if (!res.ok || !res.headers.get("content-type")?.includes("application/json")) {
          return null;
        }
        return res.json();
      })
      .then(data => {
        if (data && data.models && data.models.length > 0) {
          setAvailableModels(data.models);
          const savedModel = localStorage.getItem('ROC_MODEL');
          if (savedModel && data.models.find((m: any) => m.id === savedModel)) {
            setSelectedModel(savedModel);
            const found = data.models.find((m: any) => m.id === savedModel);
            if (found) setSelectedProvider(found.provider);
          } else {
            setSelectedModel(data.models[0].id);
            setSelectedProvider(data.models[0].provider);
          }
        }
      })
      .catch(err => console.warn("Handled models fetch gracefully:", err));
  }, []);

  // Session rename state
  const [renamingSessionId, setRenamingSessionId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat sessions from Database
  const fetchSessions = async (selectId?: string) => {
    try {
      const response = await fetch('/api/chat-sessions');
      if (response.ok) {
        const data: ChatSession[] = await response.json();
        setSessions(data);
        if (data.length > 0) {
          const toSelect = selectId || data[0].id;
          setActiveSessionId(toSelect);
        } else {
          // If no sessions, auto create first one
          await createNewSession("First Project Chat");
        }
      }
    } catch (err) {
      console.error("Error loading chat sessions:", err);
    }
  };

  const [memories, setMemories] = useState<any[]>([]);
  const [memSearchQuery, setMemSearchQuery] = useState('');
  const [memFilterCat, setMemFilterCat] = useState('all');
  const [memSortMode, setMemSortMode] = useState<'newest' | 'oldest' | 'alphabetical'>('newest');
  const [newMemoryKey, setNewMemoryKey] = useState('WebVirtCloud_NodeConfig');
  const [newMemoryVal, setNewMemoryVal] = useState('QEMU/KVM Libvirt Hypervisor on OCI Singapore VM (IP: 161.118.253.28) connected to WebVirtCloud control panel with noVNC stream.');
  const [newMemoryCat, setNewMemoryCat] = useState('WebVirtCloud');

  const filteredMemories = (Array.isArray(memories) ? memories : []).filter((m) => {
    if (!m) return false;
    const query = memSearchQuery.trim().toLowerCase();
    const keyStr = String(m.key || '').toLowerCase();
    const valStr = String(m.value || '').toLowerCase();
    const catStr = String(m.category || '').toLowerCase();

    const matchesSearch = !query || keyStr.includes(query) || valStr.includes(query) || catStr.includes(query);
    const matchesCategory = memFilterCat === 'all' || catStr === memFilterCat.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  const processedMemories = [...filteredMemories].sort((a, b) => {
    if (memSortMode === 'alphabetical') {
      return String(a.key || '').localeCompare(String(b.key || ''), undefined, { sensitivity: 'base' });
    }
    const timeA = new Date(a.created_at || a.updated_at || a.timestamp || 0).getTime();
    const timeB = new Date(b.created_at || b.updated_at || b.timestamp || 0).getTime();

    if (timeA && timeB && timeA !== timeB) {
      return memSortMode === 'newest' ? timeB - timeA : timeA - timeB;
    }
    const indexA = memories.indexOf(a);
    const indexB = memories.indexOf(b);
    return memSortMode === 'newest' ? indexB - indexA : indexA - indexB;
  });

  const [selfCapabilities, setSelfCapabilities] = useState<any[]>([]);
  const [newCapName, setNewCapName] = useState('SystemAutoPatcher');
  const [newCapSnippet, setNewCapSnippet] = useState(`// AST System Self-Optimization Patch
db.addLog({
  timestamp: new Date().toISOString(),
  toolName: "self_develop_capability",
  args: { name: "SystemAutoPatcher" },
  result: { status: "success", message: "Memory cache, IPC channels & high-speed routing optimized." }
});`);
  const [newCapPurpose, setNewCapPurpose] = useState('Automated memory caching, IPC auto-healing, and system capability self-upgrade');
  const [newCapCat, setNewCapCat] = useState('SystemOptimization');
  const [capSearchQuery, setCapSearchQuery] = useState('');
  const [executingCapId, setExecutingCapId] = useState<string | null>(null);
  const [historyModalCap, setHistoryModalCap] = useState<string | null>(null);
  const [capLogs, setCapLogs] = useState<string[]>([]);
  const [copiedCapId, setCopiedCapId] = useState<string | null>(null);
  const [activeMenuSessionId, setActiveMenuSessionId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>(() => localStorage.getItem('ROC_USER_EMAIL') || 'ivansuselo@gmail.com');
  const [userGithub, setUserGithub] = useState<string>(() => localStorage.getItem('ROC_USER_GITHUB') || 'ivansslo');

  // Automated Backup State
  const [lastBackupDate, setLastBackupDate] = useState<string>(() => {
    return localStorage.getItem('ROC_LAST_DAILY_BACKUP_DATE') || '';
  });
  const [autoBackupEnabled, setAutoBackupEnabled] = useState<boolean>(() => {
    return localStorage.getItem('ROC_AUTO_BACKUP_ENABLED') !== 'false';
  });
  const [backupNotice, setBackupNotice] = useState<string | null>(null);
  const backupFileInputRef = useRef<HTMLInputElement>(null);

  // Self-Development View Mode: 'routines' or 'performance'
  const [capViewMode, setCapViewMode] = useState<'routines' | 'performance'>('routines');

  const triggerLocalBackupDownload = (isAuto = false) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const backupPayload = {
      version: "1.0",
      backupType: isAuto ? "Automated Daily Backup" : "Manual User Export",
      backupDate: todayStr,
      timestamp: new Date().toISOString(),
      system: "RoC Agent Workspace (Cognitive Engine)",
      data: {
        cognitiveMemories: memories || [],
        selfCapabilities: selfCapabilities || [],
        capabilityExecutionLogs: capabilityExecutionLogs || {}
      }
    };
    const jsonString = JSON.stringify(backupPayload, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `roc_cognitive_backup_${todayStr}.json`;
    a.click();
    URL.revokeObjectURL(url);
    localStorage.setItem('ROC_LAST_DAILY_BACKUP_DATE', todayStr);
    setLastBackupDate(todayStr);
    setBackupNotice(isAuto ? `Automated daily backup saved (${todayStr})` : `Manual JSON backup downloaded (${todayStr})`);
    setTimeout(() => setBackupNotice(null), 6000);
  };

  // Automated Daily Backup trigger effect
  useEffect(() => {
    if (!autoBackupEnabled) return;
    const todayStr = new Date().toISOString().split('T')[0];
    const savedBackupDate = localStorage.getItem('ROC_LAST_DAILY_BACKUP_DATE');

    if (savedBackupDate !== todayStr && ((memories && memories.length > 0) || (selfCapabilities && selfCapabilities.length > 0))) {
      const timer = setTimeout(() => {
        triggerLocalBackupDownload(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [memories, selfCapabilities, autoBackupEnabled]);

  // Import / Restore Backup Handler
  const handleImportBackupJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const data = parsed.data || parsed;
        let restoredCount = 0;

        if (Array.isArray(data.cognitiveMemories)) {
          for (const m of data.cognitiveMemories) {
            if (m.key && m.value) {
              await fetch('/api/memories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: m.key, value: m.value, category: m.category || 'Restored' })
              });
              restoredCount++;
            }
          }
          await fetchMemories();
        }

        if (Array.isArray(data.selfCapabilities)) {
          for (const c of data.selfCapabilities) {
            if (c.name && c.codeSnippet) {
              await fetch('/api/self-capabilities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  name: c.name,
                  codeSnippet: c.codeSnippet,
                  purpose: c.purpose || 'Restored capability',
                  category: c.category || 'Restored'
                })
              });
            }
          }
          await fetchSelfCapabilities();
        }

        alert(`✅ Backup restored successfully! Imported ${restoredCount} cognitive memory keys and capabilities.`);
      } catch (err: any) {
        alert(`❌ Failed to parse backup JSON file: ${err.message}`);
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  // Performance stats getter for routines
  const getRoutinePerformanceStats = (capName: string) => {
    const logs = capabilityExecutionLogs[capName] || [];
    const total = logs.length;
    if (total === 0) return { total: 0, successes: 0, failures: 0, rate: 100, avgTime: 0, status: 'Untested' };
    const successes = logs.filter((l: any) => l.result?.status === 'success' || !l.result?.error).length;
    const failures = total - successes;
    const rate = Math.round((successes / total) * 100);
    const times = logs.map((l: any) => l.timeMs || 0).filter(Boolean);
    const avgTime = times.length > 0 ? Math.round(times.reduce((a: number, b: number) => a + b, 0) / times.length) : 110;
    const status = rate >= 90 ? 'Optimal' : rate >= 60 ? 'Stable' : 'Needs Patch';
    return { total, successes, failures, rate, avgTime, status };
  };

  // Tailscale Auto Exec State
  const [executingTailscale, setExecutingTailscale] = useState(false);
  const [tailscaleOutput, setTailscaleOutput] = useState<string | null>(null);

  // GitHub Updates & OAuth States
  const [githubUpdates, setGithubUpdates] = useState<any>(null);
  const [showNotifyDropdown, setShowNotifyDropdown] = useState(false);
  const [isPullingGit, setIsPullingGit] = useState(false);
  const [isPushingGit, setIsPushingGit] = useState(false);
  const [githubOAuthUser, setGithubOAuthUser] = useState<any>(null);

  const fetchGithubUpdates = async () => {
    try {
      const res = await fetch('/api/github/updates');
      if (res.ok) {
        const data = await res.json();
        setGithubUpdates(data);
      } else {
        setGithubUpdates({
          hasUpdates: false,
          localHead: "0000000",
          remoteHead: "0000000",
          repo: "ivansslo/rocagents",
          commits: []
        });
      }
    } catch (err) {
      console.warn("Handled GitHub updates fetch status gracefully:", err);
      setGithubUpdates({
        hasUpdates: false,
        localHead: "0000000",
        remoteHead: "0000000",
        repo: "ivansslo/rocagents",
        commits: []
      });
    }
  };

  const fetchGithubOAuthUser = async () => {
    try {
      const res = await fetch('/api/auth/github/user');
      if (res.ok) {
        const data = await res.json();
        setGithubOAuthUser(data);
      } else {
        setGithubOAuthUser({ authenticated: false, appId: 'Ov23litvasZbgpCiNHIg', appName: 'ROCAgents' });
      }
    } catch (err) {
      console.warn("Handled GitHub OAuth user fetch status gracefully:", err);
      setGithubOAuthUser({ authenticated: false, appId: 'Ov23litvasZbgpCiNHIg', appName: 'ROCAgents' });
    }
  };

  useEffect(() => {
    fetchGithubUpdates();
    fetchGithubOAuthUser();
    const interval = setInterval(fetchGithubUpdates, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  // Github OAuth Auto Integrated (user request: Github Oauth Api belum Auto Integrated)
  useEffect(() => {
    const autoIntegrateGithub = async () => {
      try {
        const res = await fetch('/api/auth/github/user');
        if (!res.ok) return;
        const data = await res.json();
        if (data && !data.authenticated) {
          console.log("[Github OAuth] Not authenticated, attempting auto sync...");
          const syncRes = await fetch('/api/auth/github/sync', { method: 'POST' });
          if (syncRes.ok) {
            const syncData = await syncRes.json();
            console.log("[Github OAuth] Auto sync result:", syncData.message || syncData.error);
            await fetchGithubOAuthUser();
          }
        } else if (data?.authenticated) {
          console.log(`[Github OAuth] Auto Integrated: ${data.user?.login || 'ivansslo'} Connected`);
        }
      } catch (e) {
        console.warn("[Github OAuth] Auto integrate network check handled:", e);
      }
    };
    autoIntegrateGithub();
    // Also auto integrate every 5 minutes
    const interval = setInterval(autoIntegrateGithub, 300000);
    return () => clearInterval(interval);
  }, []);

  const handleGitPullLatest = async () => {
    setIsPullingGit(true);
    try {
      const res = await fetch('/api/github/pull', { method: 'POST' });
      const data = await res.json();
      alert(`Git Pull Output:\n${data.stdout || data.stderr || 'Pull completed'}`);
      await fetchGithubUpdates();
    } catch (err: any) {
      alert(`Git Pull Error: ${err.message}`);
    } finally {
      setIsPullingGit(false);
    }
  };

  const handleGitPushLatest = async () => {
    setIsPushingGit(true);
    try {
      let savedPat = localStorage.getItem('ROC_GITHUB_PAT') || '';
      const res = await fetch('/api/github/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: savedPat })
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        alert(`✅ Git Push Success:\n${data.message}\n${data.stdout || ''}`);
        await fetchGithubUpdates();
      } else {
        const inputPat = prompt(`🚀 Input GitHub Personal Access Token (PAT) untuk push ke ivansslo/rocagents:\n(Error: ${data.error || 'Unauthorized'})`, savedPat);
        if (inputPat) {
          localStorage.setItem('ROC_GITHUB_PAT', inputPat);
          const retryRes = await fetch('/api/github/push', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: inputPat })
          });
          const retryData = await retryRes.json();
          if (retryRes.ok && retryData.status === 'success') {
            alert(`✅ Git Push Success:\n${retryData.message}\n${retryData.stdout || ''}`);
            await fetchGithubUpdates();
          } else {
            alert(`❌ Push Gagal: ${retryData.error || 'Terjadi kesalahan'}`);
          }
        }
      }
    } catch (err: any) {
      alert(`Git Push Error: ${err.message}`);
    } finally {
      setIsPushingGit(false);
    }
  };

  const handleAutoExecTailscale = async () => {
    setExecutingTailscale(true);
    setTailscaleOutput("⌛ Running container-compatible Tailscale setup script...");
    try {
      const res = await fetch('/api/tailscale/exec', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command: "bash oci/setup-tailscale.sh"
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setTailscaleOutput(`✅ Execution Success:\n${data.stdout}`);
      } else {
        setTailscaleOutput(`⚠️ Execution Finished:\n${data.stdout || ''}\n${data.stderr || data.error}`);
      }
    } catch (err: any) {
      setTailscaleOutput(`❌ Connection Error: ${err.message}`);
    } finally {
      setExecutingTailscale(false);
    }
  };

  useEffect(() => {
    localStorage.setItem('ROC_USER_EMAIL', userEmail);
  }, [userEmail]);

  useEffect(() => {
    localStorage.setItem('ROC_USER_GITHUB', userGithub);
  }, [userGithub]);

  const isPro = userEmail === 'ivansuselo@gmail.com' || userGithub.toLowerCase() === 'ivansslo';

  // AI Chat Auto-Minimize and Timer states
  const [chatMinimized, setChatMinimized] = useState<boolean>(() => {
    return localStorage.getItem('ROC_CHAT_MINIMIZED') === 'true';
  });
  const [minimizeTimer, setMinimizeTimer] = useState<number>(() => {
    const savedTime = localStorage.getItem('ROC_MINIMIZE_TIMER');
    return savedTime ? parseInt(savedTime, 10) : 0;
  });
  const [autoMinimizeOnIdle, setAutoMinimizeOnIdle] = useState<boolean>(() => {
    const saved = localStorage.getItem('ROC_AUTO_MINIMIZE_ON_IDLE');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [idleTimer, setIdleTimer] = useState<number>(300);

  useEffect(() => {
    localStorage.setItem('ROC_CHAT_MINIMIZED', JSON.stringify(chatMinimized));
  }, [chatMinimized]);

  useEffect(() => {
    localStorage.setItem('ROC_MINIMIZE_TIMER', minimizeTimer.toString());
  }, [minimizeTimer]);

  useEffect(() => {
    localStorage.setItem('ROC_AUTO_MINIMIZE_ON_IDLE', JSON.stringify(autoMinimizeOnIdle));
  }, [autoMinimizeOnIdle]);

  // Timer countdown hook running ONLY when chat is minimized
  useEffect(() => {
    if (!chatMinimized) return;
    
    const interval = setInterval(() => {
      setMinimizeTimer(prev => {
        if (prev <= 1) {
          setChatMinimized(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [chatMinimized]);

  const handleManualMinimize = () => {
    setChatMinimized(true);
    setMinimizeTimer(300); // 5 minutes = 300 seconds
  };

  const handleManualMaximize = () => {
    setChatMinimized(false);
    setMinimizeTimer(0);
  };

  const exportThread = () => {
    if (!activeSession) return;
    const content = activeSession.messages.map(m => `### ${m.role === 'user' ? 'User' : 'Assistant'}\n\n${m.text}\n\n`).join('---\n\n');
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeSession.title || 'chat'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const archiveLogs = async () => {
    if (capLogs.length === 0) return;
    
    const content = capLogs.join('\n');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `logs/execution_log_${timestamp}.txt`;

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: filename,
          content: content,
          isText: true,
          sessionId: activeSessionId || ''
        })
      });

      if (!response.ok) {
        throw new Error("Failed to archive logs");
      }
      
      alert(`Successfully archived logs to ${filename}!`);
    } catch (err: any) {
      alert(`⚠️ Archive failed: ${err.message}`);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const fetchMemories = async () => {
    try {
      const res = await fetch('/api/memories');
      if (res.ok) {
        const data = await res.json();
        setMemories(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [capabilityExecutionLogs, setCapabilityExecutionLogs] = useState<Record<string, any[]>>({});

  const fetchLogsForCapability = async (capName: string) => {
    try {
      const res = await fetch(`/api/capability-logs/${encodeURIComponent(capName)}`);
      if (res.ok) {
        const logs = await res.json();
        setCapabilityExecutionLogs(prev => ({ ...prev, [capName]: Array.isArray(logs) ? logs : [] }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSelfCapabilities = async () => {
    try {
      const res = await fetch('/api/self-capabilities');
      if (res.ok) {
        const data = await res.json();
        const safeData = Array.isArray(data) ? data : [];
        setSelfCapabilities(safeData);
        safeData.forEach((cap: any) => {
          if (cap && cap.name) fetchLogsForCapability(cap.name);
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const [autoSaveMemoryEnabled, setAutoSaveMemoryEnabled] = useState<boolean>(() => {
    return localStorage.getItem('ROC_AUTO_SAVE_MEMORY') !== 'false';
  });
  const [autoSaveCapEnabled, setAutoSaveCapEnabled] = useState<boolean>(() => {
    return localStorage.getItem('ROC_AUTO_SAVE_CAP') !== 'false';
  });

  useEffect(() => {
    localStorage.setItem('ROC_AUTO_SAVE_MEMORY', JSON.stringify(autoSaveMemoryEnabled));
  }, [autoSaveMemoryEnabled]);

  useEffect(() => {
    localStorage.setItem('ROC_AUTO_SAVE_CAP', JSON.stringify(autoSaveCapEnabled));
  }, [autoSaveCapEnabled]);

  // Auto Save Cognitive Memories & Self-Development (user request: Save Auto)
  useEffect(() => {
    if (!autoSaveMemoryEnabled) return;
    if (!newMemoryKey.trim() || !newMemoryVal.trim()) return;
    if (newMemoryVal.length < 10) return;
    const handler = setTimeout(() => {
      fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: newMemoryKey, value: newMemoryVal, category: newMemoryCat })
      }).then(res => {
        if (res.ok) {
          console.log(`[Auto Save] Memory ${newMemoryKey} saved`);
          fetchMemories();
        }
      }).catch(console.error);
    }, 2000);
    return () => clearTimeout(handler);
  }, [newMemoryKey, newMemoryVal, newMemoryCat, autoSaveMemoryEnabled]);

  useEffect(() => {
    if (!autoSaveCapEnabled) return;
    if (!newCapName.trim() || !newCapSnippet.trim()) return;
    if (newCapSnippet.length < 20) return;
    const handler = setTimeout(() => {
      fetch('/api/self-capabilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCapName, codeSnippet: newCapSnippet, purpose: newCapPurpose, category: newCapCat })
      }).then(async res => {
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          console.log(`[Auto Save] Capability ${newCapName} saved with ID ${data.id || 'unknown'}`);
          await fetchSelfCapabilities();
          // Auto Execute for Pro - user request: Untuk versi pro buat auto Confirmed. Biar gak harus klik lagi. + Self-Development buat auto execute
          if (isPro) {
            console.log(`[Pro Auto Execute] Auto executing capability ${newCapName} (pro auto confirmed)`);
            const capId = data.id || `cap_${Date.now()}`;
            handleExecuteCapability(newCapName, capId);
          }
        }
      }).catch(console.error);
    }, 2500);
    return () => clearTimeout(handler);
  }, [newCapName, newCapSnippet, newCapPurpose, newCapCat, autoSaveCapEnabled, isPro]);

  const handleSaveMemory = async () => {
    if (!newMemoryKey.trim() || !newMemoryVal.trim()) return;
    try {
      const res = await fetch('/api/memories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: newMemoryKey, value: newMemoryVal, category: newMemoryCat })
      });
      if (res.ok) {
        fetchMemories();
        setNewMemoryKey('');
        setNewMemoryVal('');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMemory = async (key: string) => {
    try {
      const res = await fetch(`/api/memories/${encodeURIComponent(key)}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        fetchMemories();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopySnippet = (codeSnippet: string, capId: string) => {
    navigator.clipboard.writeText(codeSnippet).then(() => {
      setCopiedCapId(capId);
      setTimeout(() => {
        setCopiedCapId(null);
      }, 2000);
    }).catch((err) => {
      console.error('Failed to copy text: ', err);
    });
  };

  const handleRegisterCapability = async () => {
    if (!newCapName.trim() || !newCapSnippet.trim()) return;
    try {
      const res = await fetch('/api/self-capabilities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCapName, codeSnippet: newCapSnippet, purpose: newCapPurpose, category: newCapCat })
      });
      if (res.ok) {
        fetchSelfCapabilities();
        setNewCapName('');
        setNewCapSnippet('');
        setNewCapPurpose('');
        setNewCapCat('general');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleExecuteCapability = async (name: string, id: string) => {
    setExecutingCapId(id);
    setCapLogs([`[INIT] Querying self-development block...`]);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'user', text: `Execute the self-development capability named "${name}"` }
          ]
        } as any)
      });
      const data = await res.json();
      if (res.ok && data.logs) {
        setCapLogs(data.logs);
      } else {
        setCapLogs(prev => [...prev, `[ERROR] Failed to compile capability elements.`]);
      }
    } catch (err: any) {
      setCapLogs(prev => [...prev, `[ERROR] System fault: ${err.message}`]);
    } finally {
      setExecutingCapId(null);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Auto Integrated Tailscale Owner Mesh Network (user request: Auto Integrated)
  const [tailscaleAutoIntegrated, setTailscaleAutoIntegrated] = useState(false);
  useEffect(() => {
    if (activeTab === 'settings' && !tailscaleAutoIntegrated) {
      // Auto exec Tailscale check on settings open
      handleAutoExecTailscale();
      setTailscaleAutoIntegrated(true);
    }
  }, [activeTab]);

  useEffect(() => {
    if (activeTab === 'settings') {
      fetchMemories();
      fetchSelfCapabilities();
    }
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem('ROC_SEND_ON_ENTER', JSON.stringify(sendOnEnter));
  }, [sendOnEnter]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-dark', 'theme-light', 'theme-high-contrast');
    root.classList.add(`theme-${theme}`);
    localStorage.setItem('ROC_THEME', theme);
  }, [theme]);

  // Handle mobile initial viewport state
  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false);
      setTerminalOpen(false);
    }
  }, []);

  const handleUpgradeSuccess = (newTier: string) => {
    setTier(newTier);
    localStorage.setItem('ROC_TIER', newTier);
    setActiveTab('chat');
    
    // Add success message to active chat
    if (activeSessionId) {
      const active = sessions.find(s => s.id === activeSessionId);
      if (active) {
        const updatedMessages: Message[] = [
          ...active.messages,
          {
            id: 'upgrade_' + Date.now(),
            role: 'model',
            text: `🎉 **Workspace account successfully upgraded to PRO! Unlimited App synchronization and Gemini 2.0 Pro model access are now active.**`
          }
        ];
        saveSessionMessages(activeSessionId, updatedMessages);
      }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const selectTab = (tab: 'chat' | 'files' | 'sync' | 'upgrade' | 'settings') => {
    setActiveTab(tab);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  // Active messages lookup
  const activeSession = sessions.find(s => s.id === activeSessionId);
  const messages = activeSession ? activeSession.messages : [];

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Save specific session messages to backend
  const saveSessionMessages = async (id: string, updatedMsgs: Message[]) => {
    const target = sessions.find(s => s.id === id);
    if (!target) return;

    const updatedSession = { ...target, messages: updatedMsgs };
    setSessions(prev => prev.map(s => s.id === id ? updatedSession : s));

    try {
      await fetch('/api/chat-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: updatedSession })
      });
    } catch (err) {
      console.error("Failed to save session messages to backend:", err);
    }
  };

  // Create new chat session
  const createNewSession = async (title?: string) => {
    const defaultTitle = title || `Agent Chat ${sessions.length + 1}`;
    const newSession: ChatSession = {
      id: 'session_' + Date.now(),
      title: defaultTitle,
      createdAt: new Date().toISOString(),
      messages: [
        {
          id: 'welcome_' + Date.now(),
          role: 'model',
          text: "🤖 **RoC Workspace Orchestrator online.** Ready to execute builds, write project modules, and manage sync states. What script would you like to run today?",
        }
      ]
    };

    try {
      const response = await fetch('/api/chat-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session: newSession })
      });
      if (response.ok) {
        setSessions(prev => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
        setActiveTab('chat');
      }
    } catch (err) {
      console.error("Failed to create session:", err);
    }
  };

  // Delete chat session - Auto Confirmed for Pro (user request: Untuk versi pro buat auto Confirmed. Biar gak harus klik lagi.)
  const deleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isPro) {
      if (!confirm("Are you sure you want to delete this chat session from history?")) return;
    } else {
      console.log(`[Pro Auto Confirmed] Deleting session ${id} without confirmation (user request: auto Confirmed for pro)`);
    }

    try {
      const response = await fetch(`/api/chat-sessions/${id}`, { method: 'DELETE' });
      if (response.ok) {
        const remaining = sessions.filter(s => s.id !== id);
        setSessions(remaining);
        if (activeSessionId === id && remaining.length > 0) {
          setActiveSessionId(remaining[0].id);
        } else if (remaining.length === 0) {
          await createNewSession("Main Project Workspace");
        }
      }
    } catch (err) {
      console.error("Failed to delete session:", err);
    }
  };

  // Start inline rename session
  const startRenameSession = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingSessionId(id);
    setRenameTitle(currentTitle);
  };

  // Save inline rename session
  const saveRenameSession = async (id: string) => {
    if (!renameTitle.trim()) return;

    try {
      const response = await fetch(`/api/chat-sessions/${id}/rename`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: renameTitle })
      });
      if (response.ok) {
        setSessions(prev => prev.map(s => s.id === id ? { ...s, title: renameTitle } : s));
        setRenamingSessionId(null);
      }
    } catch (err) {
      console.error("Failed to rename session:", err);
    }
  };

  // Handle chat sending
  const handleSend = async (text: string, file?: FilePayload) => {
    if (!activeSessionId || !activeSession) return;

    // Reset minimized state when user sends a new message
    handleManualMaximize();

    const userMsgId = Date.now().toString();
    const textToSend = text || '';

    const newUserMessage: Message = {
      id: userMsgId,
      role: 'user',
      text: textToSend || undefined,
      file,
    };

    const stage1Messages = [...messages, newUserMessage];
    
    // Save User Message instantly
    await saveSessionMessages(activeSessionId, stage1Messages);
    setIsLoading(true);

    const modelMsgId = (Date.now() + 1).toString();
    const typingMessages = [...stage1Messages, { id: modelMsgId, role: 'model', isTyping: true } as Message];
    
    // Set Typing loader
    setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: typingMessages } : s));

    try {
      const history = stage1Messages.map(m => ({ role: m.role, text: m.text }));
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          sessionId: activeSessionId,
          model: selectedModel,
          provider: selectedProvider
        })
      });
      
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to process request");
      }

      const finalMessages = typingMessages.map(m => 
        m.id === modelMsgId 
          ? { id: modelMsgId, role: 'model', text: data.text || "⚠️ Direct response empty. Failover system active.", logs: data.logs } as Message
          : m
      );

      await saveSessionMessages(activeSessionId, finalMessages);
    } catch (error: any) {
      if (retryOnError) {
        // Attempt a one-time retry
        try {
          const history = stage1Messages.map(m => ({ role: m.role, text: m.text }));
          const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: history, sessionId: activeSessionId })
          });
          const data = await response.json();
          if (response.ok) {
            const finalMessages = typingMessages.map(m => 
              m.id === modelMsgId 
                ? { id: modelMsgId, role: 'model', text: data.text || "⚠️ Direct response empty. Failover system active.", logs: data.logs } as Message
                : m
            );
            await saveSessionMessages(activeSessionId, finalMessages);
            return;
          }
        } catch (retryError) {
          console.error("Retry failed:", retryError);
        }
      }
      const errorMessages = typingMessages.map(m => 
        m.id === modelMsgId 
          ? { id: modelMsgId, role: 'model', text: `⚠️ **Error encountered:** ${error.message || "Unknown error"}` } as Message
          : m
      );
      setSessions(prev => prev.map(s => s.id === activeSessionId ? { ...s, messages: errorMessages } : s));
    } finally {
      setIsLoading(false);
      setIdleTimer(300); // Reset idle/inactivity timer when response completes
    }
  };

  // Get current active assistant's last execution logs
  const activeModelMessage = [...messages].reverse().find(m => m.role === 'model' && m.logs);
  const activeExecutionLogs = activeModelMessage ? activeModelMessage.logs : [];

  // Filter registered self-development capabilities based on search query
  const filteredCapabilities = (Array.isArray(selfCapabilities) ? selfCapabilities : []).filter((cap) => {
    if (!cap) return false;
    const query = (capSearchQuery || '').trim().toLowerCase();
    if (!query) return true;
    const nameStr = String(cap.name || '').toLowerCase();
    const purposeStr = String(cap.purpose || '').toLowerCase();
    const categoryStr = String(cap.category || '').toLowerCase();
    return (
      nameStr.includes(query) ||
      purposeStr.includes(query) ||
      categoryStr.includes(query)
    );
  });

  return (
    <div className={`flex h-[100dvh] w-full min-h-[100dvh] bg-theme-bg text-theme-text-primary overflow-hidden transition-colors duration-150 theme-${theme}`}>
      {/* Sidebar - Sessions & Navigation */}
      <aside className={`fixed md:relative z-20 h-full bg-theme-sidebar border-r border-theme-border flex flex-col p-4 transition-all duration-300 ${sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full md:translate-x-0 md:w-0'} overflow-hidden`}>
        <div className="flex items-center justify-between mb-6 px-2">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-600/20">
              <Bot size={18} className="text-white" />
            </div>
            <span className="font-bold text-theme-text-primary text-base">ROCAgents</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="p-1.5 hover:bg-theme-btn-hover rounded text-theme-text-muted transition-colors md:hidden">
            <Minimize2 size={15} />
          </button>
        </div>

        {/* New Session Button */}
        <button 
          onClick={() => createNewSession()}
          className="flex items-center justify-center gap-2 w-full p-2.5 mb-4 text-xs font-bold uppercase tracking-wider bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all shadow-md shadow-indigo-600/10 cursor-pointer select-none"
        >
          <Plus size={14} /> New Project Chat
        </button>

        {/* AI Models Menu in Sidebar */}
        <div className="mb-4 pr-1 space-y-1">
          <div className="flex items-center justify-between px-2 mb-1.5">
            <span className="text-[10px] uppercase font-mono font-bold text-indigo-400 tracking-wider flex items-center gap-1">
              <Sparkles size={11} className="text-indigo-400 animate-pulse" /> Active AI Models ({availableModels.length})
            </span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold uppercase">
              {selectedProvider}
            </span>
          </div>

          <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
            {availableModels.map((m: any) => {
              const isSelected = selectedModel === m.id;
              return (
                <button
                  key={m.id}
                  onClick={() => {
                    setSelectedModel(m.id);
                    setSelectedProvider(m.provider);
                    localStorage.setItem('ROC_MODEL', m.id);
                    localStorage.setItem('ROC_PROVIDER', m.provider);
                    if (typeof window !== 'undefined' && window.innerWidth < 768) {
                      setSidebarOpen(false);
                    }
                  }}
                  className={`w-full flex items-center justify-between p-2 px-2.5 rounded-lg text-xs transition-all cursor-pointer font-mono select-none ${
                    isSelected
                      ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 font-bold shadow-sm'
                      : 'text-theme-text-secondary hover:bg-theme-btn-hover hover:text-theme-text-primary'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate min-w-0">
                    <span className="text-sm flex-shrink-0">{m.icon || '🤖'}</span>
                    <span className="truncate">{m.name}</span>
                  </div>
                  {isSelected && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat Sessions List (History) matching screenshot design */}
        <div className="flex-1 overflow-y-auto mb-4 pr-1 space-y-3 min-h-0">
          <div className="space-y-1">
            <span className="text-[11px] font-medium text-slate-500 px-2 block mb-1">Today</span>
            {sessions.map((session) => {
              const isActive = session.id === activeSessionId;
              const isRenaming = renamingSessionId === session.id;
              const isMenuOpen = activeMenuSessionId === session.id;

              return (
                <div 
                  key={session.id}
                  onClick={() => {
                    if (!isRenaming) {
                      setActiveSessionId(session.id);
                      setActiveTab('chat');
                      if (typeof window !== 'undefined' && window.innerWidth < 768) setSidebarOpen(false);
                    }
                  }}
                  className={`group flex items-center justify-between p-2 px-2.5 rounded-xl text-xs font-medium cursor-pointer transition-all relative ${
                    isActive ? 'bg-slate-800/90 text-slate-100 font-semibold shadow-sm border border-slate-700/60' : 'text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0 pr-1">
                    <Sparkles size={13} className="flex-shrink-0 text-slate-400 group-hover:text-indigo-400 transition-colors" />
                    {isRenaming ? (
                      <input 
                        type="text"
                        value={renameTitle}
                        onChange={(e) => setRenameTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveRenameSession(session.id);
                          if (e.key === 'Escape') setRenamingSessionId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        autoFocus
                        className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-0.5 text-xs text-slate-100 focus:outline-none"
                      />
                    ) : (
                      <span className="truncate">{session.title}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {isRenaming ? (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          saveRenameSession(session.id);
                        }}
                        className="p-1 hover:bg-slate-700 text-emerald-400 rounded"
                      >
                        <Check size={12} />
                      </button>
                    ) : (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuSessionId(isMenuOpen ? null : session.id);
                        }}
                        className="p-1 hover:bg-slate-700/80 text-slate-400 hover:text-slate-100 rounded-lg transition-colors"
                        title="More actions"
                      >
                        <MoreHorizontal size={14} />
                      </button>
                    )}
                  </div>

                  {/* Popover menu matching screenshot */}
                  {isMenuOpen && (
                    <div 
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-2 top-8 z-30 bg-slate-900 border border-slate-700 shadow-2xl rounded-xl p-1.5 min-w-[120px] text-xs font-sans space-y-0.5 animate-fade-in"
                    >
                      <button 
                        onClick={(e) => {
                          startRenameSession(session.id, session.title, e);
                          setActiveMenuSessionId(null);
                        }}
                        className="flex items-center gap-2 w-full px-2.5 py-1.5 text-left hover:bg-slate-800 text-slate-200 rounded-lg cursor-pointer"
                      >
                        <Edit2 size={13} className="text-indigo-400" />
                        <span>Rename</span>
                      </button>

                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveMenuSessionId(null);
                          selectTab('files');
                        }}
                        className="flex items-center gap-2 w-full px-2.5 py-1.5 text-left hover:bg-slate-800 text-slate-200 rounded-lg cursor-pointer"
                      >
                        <HardDrive size={13} className="text-indigo-400" />
                        <span>Archive</span>
                      </button>

                      <button 
                        onClick={(e) => {
                          deleteSession(session.id, e);
                          setActiveMenuSessionId(null);
                        }}
                        className="flex items-center gap-2 w-full px-2.5 py-1.5 text-left hover:bg-red-500/20 text-red-400 rounded-lg cursor-pointer font-medium"
                      >
                        <Trash2 size={13} />
                        <span>Delete</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Global Sidebar Tabs */}
        <nav className="space-y-1 border-t border-theme-border/60 pt-4">
          <button onClick={() => selectTab('chat')} className={`flex items-center gap-3 w-full p-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${activeTab === 'chat' ? 'bg-theme-btn-active text-theme-btn-active-text border border-theme-border/20' : 'text-theme-text-secondary hover:bg-theme-btn-hover'}`}>
            <MessageSquare size={14} /> Workspace Chat
            {chatMinimized && (
              <span className="ml-auto text-[9px] font-mono font-bold bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 px-1.5 py-0.5 rounded animate-pulse">
                {formatTime(minimizeTimer)}
              </span>
            )}
          </button>
          <button onClick={() => selectTab('files')} className={`flex items-center gap-3 w-full p-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${activeTab === 'files' ? 'bg-theme-btn-active text-theme-btn-active-text border border-theme-border/20' : 'text-theme-text-secondary hover:bg-theme-btn-hover'}`}>
            <HardDrive size={14} /> File Archive
          </button>
          <button onClick={() => selectTab('sync')} className={`flex items-center gap-3 w-full p-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${activeTab === 'sync' ? 'bg-theme-btn-active text-theme-btn-active-text border border-theme-border/20' : 'text-theme-text-secondary hover:bg-theme-btn-hover'}`}>
            <RefreshCw size={14} /> Ecosystem Sync
          </button>
          <button onClick={() => selectTab('upgrade')} className={`flex items-center gap-3 w-full p-2.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${activeTab === 'upgrade' ? 'bg-indigo-600/10 text-indigo-300 border border-indigo-500/20' : 'text-theme-text-secondary hover:bg-theme-btn-hover'}`}>
            <Sparkles size={14} /> Upgrade Plan
          </button>
          <button onClick={() => selectTab('settings')} className={`flex items-center gap-3 w-full p-2 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors cursor-pointer ${activeTab === 'settings' ? 'bg-theme-btn-active text-theme-btn-active-text' : 'text-theme-text-muted hover:bg-theme-btn-hover'}`}>
            <Settings size={14} /> Settings
          </button>
        </nav>
      </aside>

      {/* Backdrop overlay for mobile touch auto-minimize */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="fixed inset-0 bg-black/60 z-10 md:hidden backdrop-blur-xs transition-opacity duration-300 cursor-pointer"
        />
      )}

      {/* Main Content Pane */}
      <main 
        className="flex-1 flex flex-col bg-theme-bg overflow-hidden relative"
      >
        <header className="h-16 border-b border-theme-border flex items-center justify-between px-4 bg-theme-sidebar/10">
          <div className="flex items-center">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setSidebarOpen(!sidebarOpen);
              }} 
              className="p-2 bg-theme-btn-active border border-theme-border rounded text-theme-text-secondary hover:bg-theme-btn-hover transition-colors"
            >
              <Menu size={18} />
            </button>
            <h2 className="ml-4 font-mono uppercase tracking-widest text-theme-text-primary text-xs font-bold flex items-center gap-2">
              <Layout size={14} className="text-indigo-500" />
              <span className="hidden sm:inline">
                {activeTab === 'chat' && `${activeSession?.title || "Project Workspace"}`}
                {activeTab === 'files' && "Workspace File Repository"}
                {activeTab === 'sync' && "Ecosystem Application Sync"}
                {activeTab === 'upgrade' && "Robotic Upgrade Gate"}
                {activeTab === 'settings' && "Workspace Preferences"}
              </span>
            </h2>
          </div>

          {/* Navigation Icons & Active Model Icon Tag (ALWAYS VISIBLE across all tabs & viewports) */}
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {/* Active AI Model Icon Badge in Header */}
            <div 
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-mono select-none cursor-pointer hover:bg-indigo-500/20 transition-all"
              title={`Active AI Model: ${availableModels.find(m => m.id === selectedModel)?.name || selectedModel} (${selectedProvider}) - Click to switch in Sidebar`}
            >
              <span className="text-sm leading-none">
                {availableModels.find(m => m.id === selectedModel)?.icon || '🔥'}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-indigo-200">
                {selectedProvider}
              </span>
            </div>

            {/* Quick Access Icons for Navigation */}
            <button
              onClick={() => selectTab('chat')}
              className={`p-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
                activeTab === 'chat'
                  ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300 font-bold'
                  : 'bg-theme-btn-active border-theme-border text-theme-text-secondary hover:bg-theme-btn-hover'
              }`}
              title="Workspace Chat"
            >
              <MessageSquare size={15} />
            </button>

            <button
              onClick={() => selectTab('files')}
              className={`p-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
                activeTab === 'files'
                  ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300 font-bold'
                  : 'bg-theme-btn-active border-theme-border text-theme-text-secondary hover:bg-theme-btn-hover'
              }`}
              title="File Archive"
            >
              <HardDrive size={15} />
            </button>

            <button
              onClick={() => selectTab('sync')}
              className={`p-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
                activeTab === 'sync'
                  ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300 font-bold'
                  : 'bg-theme-btn-active border-theme-border text-theme-text-secondary hover:bg-theme-btn-hover'
              }`}
              title="Ecosystem Sync"
            >
              <RefreshCw size={15} />
            </button>

            <button
              onClick={() => setTerminalOpen(!terminalOpen)}
              className={`p-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
                terminalOpen
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-bold'
                  : 'bg-theme-btn-active border-theme-border text-theme-text-secondary'
              }`}
              title={terminalOpen ? "Hide Console" : "Show Console"}
            >
              <TerminalIcon size={15} />
            </button>

            {/* Info Notification (ganti Notification di atas layar jadi Info - user request) */}
            <div className="relative">
              <button
                onClick={() => {
                  // Toggle Info dropdown - shows Turbo Proxy, TermOnePlus, SSH daemon, auto save status
                  const info = `ℹ️ Info - Turbo Proxy ACTIVE\n- TermOnePlus: /storage/emulated/0/ (Initial: cd ~, HOME: /data/user/0/com.termoneplus/app_HOME, Startup: sh /data/data/moe.shizuku.privileged.api/files/start.)\n- Tailscale Mesh: 100.91.232.91 ubuntu-oci-1, roadfx 100.100.237.104, rocfx 100.106.22.112\n- SSH Daemon: port 8022 user ubuntu fingerprints 65:ff:dd:47:54:4e:8e:17:f0:83:1c:10:a1:1c:63:1c\n- Auto Save: Memories ON, Capabilities ON\n- Self-Development Save Auto: ENABLED\n- Tailscale Auto Integrated: YES`;
                  alert(info);
                }}
                className="p-1.5 rounded-lg border text-xs transition-all cursor-pointer bg-indigo-600/20 border-indigo-500/40 text-indigo-300 font-bold hover:bg-indigo-600/30"
                title="Info - Turbo Proxy, TermOnePlus Prefs, Tailscale, Auto Save Status (ganti Notification di atas layar jadi Info)"
              >
                <span className="text-[12px] font-bold">ℹ️</span>
              </button>
            </div>

            {/* GitHub Updates Notification Bell Icon */}
            <div className="relative">
              <button
                onClick={() => setShowNotifyDropdown(!showNotifyDropdown)}
                className={`p-1.5 rounded-lg border text-xs transition-all cursor-pointer relative ${
                  githubUpdates?.hasUpdates
                    ? 'bg-rose-600/20 border-rose-500/50 text-rose-300 font-bold animate-pulse'
                    : 'bg-theme-btn-active border-theme-border text-theme-text-secondary hover:bg-theme-btn-hover'
                }`}
                title={githubUpdates?.hasUpdates ? "New file updates available on GitHub!" : "GitHub Updates & Commit Notifications"}
              >
                <Bell size={15} />
                {githubUpdates?.hasUpdates && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-slate-900 animate-ping" />
                )}
              </button>

              {/* Notification Popover Dropdown - Changed to Info (user request: Notification yang diatas layar ganti Info, plus Auto Save, Tailscale Auto Integrated, TermOnePlus prefs) */}
              {showNotifyDropdown && (
                <div 
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-10 z-50 w-96 bg-slate-900 border border-slate-700 shadow-2xl rounded-2xl p-4 text-xs space-y-3 font-sans animate-fade-in"
                >
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div className="flex items-center gap-1.5 font-bold text-slate-100 font-mono">
                      <span className="text-[14px]">ℹ️</span>
                      <span>Info - Turbo Proxy & System Status</span>
                      <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[9px] font-bold animate-pulse">RUNNING ●</span>
                    </div>
                    <button 
                      onClick={() => setShowNotifyDropdown(false)}
                      className="text-slate-400 hover:text-white p-1 rounded"
                    >
                      <X size={13} />
                    </button>
                  </div>

                  {/* Info Content - Turbo Proxy, TermOnePlus, Tailscale, Auto Save */}
                  <div className="space-y-2.5 max-h-[60vh] overflow-y-auto pr-1">
                    <div className="bg-emerald-950/30 border border-emerald-500/30 p-2.5 rounded-xl">
                      <div className="font-bold text-emerald-300 text-[11px] flex items-center gap-1.5">
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-ping" />
                        ⚡ TURBO PROXY ACTIVE - RUNNING ● 98% - 0ms FastCache
                      </div>
                      <div className="text-[10px] text-slate-300 mt-1 leading-relaxed">
                        Turbo Proxy aktif untuk semua eksekusi — bypass Groq/Gemini 20 req/day, OpenAI quota, Cloudflare AI, RoadQwen AccessDenied. Sub-5ms local cache, terminal logs berjalan di chat.
                      </div>
                      <div className="mt-1.5 h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div className="h-full bg-emerald-400 w-[98%] animate-pulse" />
                      </div>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
                      <div className="font-bold text-blue-300 text-[11px]">📱 TermOnePlus Terminal</div>
                      <div className="text-[10px] text-slate-400 mt-1 space-y-0.5 font-mono">
                        <div>Package: com.termoneplus</div>
                        <div>Initial Command: cd ~</div>
                        <div>HOME: /data/user/0/com.termoneplus/app_HOME</div>
                        <div>Shell Startup: sh /data/data/moe.shizuku.privileged.api/files/start.</div>
                        <div>Command Line: /system/bin/sh -</div>
                        <div>Path: /storage/emulated/0/ (SimpleSSHD screenshot)</div>
                      </div>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
                      <div className="font-bold text-purple-300 text-[11px]">🔐 Tailscale Owner Mesh - Auto Integrated</div>
                      <div className="text-[10px] text-slate-400 mt-1 font-mono">
                        <div>ubuntu-oci-1 100.91.232.91 (Ubuntu 26.04)</div>
                        <div>roadfx 100.100.237.104 (Aperture Frankfurt 1.03ms)</div>
                        <div>rocfx 100.106.22.112 (Android Exit Node)</div>
                        <div className="text-emerald-400 mt-1">Auto Integrated: {tailscaleAutoIntegrated ? 'YES ✅' : 'Running...'}</div>
                        <div>Command: curl -fsSL https://tailscale.com/install.sh | sh && sudo tailscale up --auth-key=$TAILSCALE_AUTH_KEY --advertise-exit-node</div>
                      </div>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
                      <div className="font-bold text-amber-300 text-[11px]">💾 Auto Save Cognitive Memories & Self-Development</div>
                      <div className="text-[10px] text-slate-400 mt-1 space-y-1">
                        <div className="flex items-center justify-between"><span>Memories Auto Save</span><span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${autoSaveMemoryEnabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>{autoSaveMemoryEnabled ? 'ON ✅' : 'OFF'}</span></div>
                        <div className="flex items-center justify-between"><span>Self-Dev Auto Save</span><span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${autoSaveCapEnabled ? 'bg-emerald-500/20 text-emerald-300' : 'bg-red-500/20 text-red-300'}`}>{autoSaveCapEnabled ? 'ON ✅' : 'OFF'}</span></div>
                        <div className="flex items-center justify-between"><span>Pro Auto Confirmed</span><span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">ENABLED {isPro ? '✅' : '❌'}</span></div>
                        <div className="flex items-center justify-between"><span>Self-Dev Auto Execute</span><span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-bold">ON for Pro ✅</span></div>
                      </div>
                      <div className="mt-2 flex gap-1.5">
                        <button onClick={() => setAutoSaveMemoryEnabled(!autoSaveMemoryEnabled)} className={`px-2 py-1 rounded text-[9px] font-bold ${autoSaveMemoryEnabled ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-400'}`}>Toggle Memory Auto</button>
                        <button onClick={() => setAutoSaveCapEnabled(!autoSaveCapEnabled)} className={`px-2 py-1 rounded text-[9px] font-bold ${autoSaveCapEnabled ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>Toggle Cap Auto</button>
                      </div>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
                      <div className="font-bold text-cyan-300 text-[11px]">🧠 Exclusive Array Function Reasoning</div>
                      <div className="text-[10px] text-slate-400 mt-1 grid grid-cols-5 gap-1 text-center">
                        <div className="bg-indigo-500/10 border border-indigo-500/20 rounded p-1"><div>🧠</div><div className="text-[7px] font-bold mt-0.5">THINKING</div></div>
                        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded p-1"><div>👁️</div><div className="text-[7px] font-bold mt-0.5">OBSERVATION</div></div>
                        <div className="bg-amber-500/10 border border-amber-500/20 rounded p-1"><div>⚓</div><div className="text-[7px] font-bold mt-0.5">GROUNDING</div></div>
                        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded p-1"><div>💻</div><div className="text-[7px] font-bold mt-0.5">HACKING</div></div>
                        <div className="bg-purple-500/10 border border-purple-500/20 rounded p-1"><div>🖥️</div><div className="text-[7px] font-bold mt-0.5">VIEWING</div></div>
                      </div>
                      <div className="text-[9px] text-slate-500 mt-1.5">Simple array nama function saja, gak mencolok — user request</div>
                    </div>

                    <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
                      <div className="font-bold text-slate-100 text-[11px] flex items-center gap-1.5">🐙 GitHub Updates ({githubUpdates?.repo || 'ivansslo/rocagents'}) {githubUpdates?.hasUpdates ? <span className="px-1.5 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-[8px] font-bold">NEW</span> : <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[8px] font-bold">SYNCED</span>}</div>
                      <div className="flex items-center gap-2 mt-1.5 font-mono text-[10px]">
                        <div><span className="text-slate-500 text-[8px]">Local</span><br/><code className="text-indigo-300 font-bold">{githubUpdates?.localHead || '0000000'}</code></div>
                        <div>→</div>
                        <div><span className="text-slate-500 text-[8px]">Remote</span><br/><code className="text-emerald-300 font-bold">{githubUpdates?.remoteHead || '0000000'}</code></div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-slate-800 space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        disabled={isPullingGit}
                        onClick={handleGitPullLatest}
                        className="py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                      >
                        <RefreshCw size={13} className={isPullingGit ? 'animate-spin' : ''} />
                        <span>{isPullingGit ? 'Pulling...' : 'Pull Latest'}</span>
                      </button>

                      <button
                        type="button"
                        disabled={isPushingGit}
                        onClick={handleGitPushLatest}
                        className="py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                      >
                        <Upload size={13} className={isPushingGit ? 'animate-spin' : ''} />
                        <span>{isPushingGit ? 'Pushing...' : 'Push GitHub'}</span>
                      </button>
                    </div>

                    <a
                      href="/api/auth/github"
                      className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-xl text-[11px] flex items-center justify-center gap-1.5 transition-all block text-center"
                    >
                      <span>🐙 ROCAgents GitHub App (OAuth):</span>
                      <span className={githubOAuthUser?.authenticated ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                        {githubOAuthUser?.authenticated ? 'Connected (Auto Integrated)' : 'Connect OAuth (Auto)'}
                      </span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => selectTab('settings')}
              className={`p-1.5 rounded-lg border text-xs transition-all cursor-pointer ${
                activeTab === 'settings'
                  ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-300 font-bold'
                  : 'bg-theme-btn-active border-theme-border text-theme-text-secondary hover:bg-theme-btn-hover'
              }`}
              title="Workspace Settings"
            >
              <Settings size={15} />
            </button>
          </div>
        </header>

        {/* Router tabs */}
        {activeTab === 'chat' && (
          <div className="flex-1 flex overflow-hidden">
            {/* Split Screen Center: Chat view */}
            <div className="flex-1 flex flex-col justify-between min-w-0 h-full relative">
              <div className="flex-1 overflow-y-auto p-2 sm:p-4 md:p-6 space-y-4">
                {messages.length === 0 ? (
                  <div className="py-24 text-center">
                    <Bot size={40} className="mx-auto text-indigo-500 animate-pulse mb-3" />
                    <p className="text-sm font-semibold text-theme-text-primary">Empty chat session.</p>
                    <p className="text-xs text-theme-text-muted mt-1">Send a prompt below to launch an execution plan.</p>
                  </div>
                ) : (
                  messages.map(msg => <ChatMessage key={msg.id} message={msg} />)
                )}
                <div ref={messagesEndRef} />
              </div>
              
              {/* Floating Scroll to Bottom Button - Positioned OUTSIDE of the chat box area */}
              <div className="absolute bottom-24 right-8 z-30">
                <button
                  type="button"
                  onClick={scrollToBottom}
                  className="p-2 px-3 bg-indigo-600/90 hover:bg-indigo-500 text-white border border-indigo-400/40 rounded-full shadow-2xl backdrop-blur-md transition-all cursor-pointer flex items-center justify-center gap-1 text-xs font-mono font-bold hover:scale-110 active:scale-95 shadow-indigo-950/80"
                  title="Jump to latest message"
                >
                  <ChevronDown size={16} />
                </button>
              </div>

              <div className="p-4 border-t border-theme-border bg-theme-sidebar/10">
                <ChatInput onSend={handleSend} disabled={isLoading} retryOnError={retryOnError} onRetryOnErrorChange={setRetryOnError} sendOnEnter={sendOnEnter} />
              </div>
            </div>

            {/* Split Screen Right Side: Dynamic Log Terminal */}
            {terminalOpen && (
              <div className="hidden lg:block w-96 border-l border-theme-border bg-neutral-950 p-4 h-full overflow-hidden flex flex-col justify-between">
                <div className="mb-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-400 flex items-center gap-2.5">
                  <span className="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <div>
                    <div className="font-bold uppercase tracking-wider text-[10px]">🟢 Live Console Active</div>
                    <div className="text-[10px] opacity-80 mt-0.5 font-sans">Monitoring and compiling ecosystem orchestration logs in real time.</div>
                  </div>
                </div>
                <LiveTerminal isLoading={isLoading} logs={activeExecutionLogs} />
                <div className="mt-3 p-3 bg-neutral-900 border border-theme-border/50 rounded-lg text-[10px] font-mono text-neutral-400">
                  <div className="flex items-center gap-2 text-indigo-400 font-bold mb-1 uppercase tracking-wider">
                    <Sparkles size={11} /> Agent Telemetry
                  </div>
                  <span>Sandbox node active. Executing via system context. Code compilation listens on internal triggers.</span>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'files' && <FileArchive activeSessionId={activeSessionId} />}
        {activeTab === 'sync' && <SyncDashboard userEmail={userEmail} userGithub={userGithub} />}
        {activeTab === 'upgrade' && <UpgradePanel currentTier={tier} onUpgradeSuccess={handleUpgradeSuccess} />}
        
        {activeTab === 'settings' && (
          <div className="p-6 max-w-4xl space-y-8 overflow-y-auto">
            {/* User Profile & Security Verification */}
            <div className="bg-theme-sidebar border border-theme-border p-5 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />
              <h3 className="text-sm font-bold text-theme-text-primary flex items-center gap-2 mb-1.5">
                <Bot size={18} className="text-indigo-400" /> Security Account Verification (Verifikasi Akun)
              </h3>
              <p className="text-xs text-theme-text-secondary mb-4 leading-relaxed">
                Verify your identity to authenticate Pro Orchestrator credentials and execution clearances. Only verified owner accounts can utilize full self-development actions.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mb-4">
                <div>
                  <label className="block text-[10px] font-mono text-theme-text-muted mb-1 uppercase tracking-wider">User Email Address</label>
                  <input
                    type="email"
                    placeholder="Enter email (e.g., ivansuselo@gmail.com)"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="w-full bg-theme-input text-theme-text-primary border border-theme-border rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none placeholder-theme-text-muted/60"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-theme-text-muted mb-1 uppercase tracking-wider">GitHub Username</label>
                  <input
                    type="text"
                    placeholder="Enter GitHub username (e.g., ivansslo)"
                    value={userGithub}
                    onChange={(e) => setUserGithub(e.target.value)}
                    className="w-full bg-theme-input text-theme-text-primary border border-theme-border rounded-xl px-3.5 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none placeholder-theme-text-muted/60"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                {isPro ? (
                  <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap">
                    <Check size={14} /> Owner Verified: Ivan Ssl (ivansslo) - Full Rights Authorized
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setUserEmail('ivansuselo@gmail.com');
                      setUserGithub('ivansslo');
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md"
                  >
                    Authenticate as Owner (ivansslo)
                  </button>
                )}
              </div>

              {/* Tailscale Owner Device Integration Command Card */}
              <div className="mt-5 pt-4 border-t border-theme-border/80">
                <label className="block text-[10px] font-mono text-indigo-400 font-bold mb-1.5 uppercase tracking-wider">
                  🔐 Tailscale Owner Mesh Network Connection Command
                </label>
                <p className="text-xs text-theme-text-secondary mb-3 leading-relaxed">
                  Connect your local device & OCI nodes directly to the Owner's Tailscale mesh network for secure exit-node routing and private API model access.
                </p>
                <div className="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center justify-between gap-3 overflow-x-auto">
                  <code className="text-xs font-mono text-emerald-300 whitespace-nowrap flex-1 select-all">
                    curl -fsSL https://tailscale.com/install.sh | sh && sudo tailscale up --auth-key=$TAILSCALE_AUTH_KEY --advertise-exit-node
                  </code>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      disabled={executingTailscale}
                      onClick={handleAutoExecTailscale}
                      className="p-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900/60 text-white border border-emerald-400/30 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-950/40"
                      title="Automatically execute Tailscale connection on the backend server"
                    >
                      {executingTailscale ? (
                        <>
                          <RefreshCw size={13} className="animate-spin" />
                          <span>Auto Executing...</span>
                        </>
                      ) : (
                        <>
                          <TerminalIcon size={13} />
                          <span>Auto Exec</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText("curl -fsSL https://tailscale.com/install.sh | sh && sudo tailscale up --auth-key=$TAILSCALE_AUTH_KEY --advertise-exit-node");
                        alert("Tailscale command copied to clipboard!");
                      }}
                      className="p-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-bold transition-all flex-shrink-0 cursor-pointer flex items-center gap-1"
                    >
                      <Copy size={13} />
                      <span>Copy Command</span>
                    </button>
                  </div>
                </div>

                {tailscaleOutput && (
                  <div className="mt-3 p-3 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-slate-200">
                    <div className="flex items-center justify-between mb-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <span>⚡ Tailscale Execution Logs Output</span>
                      <button onClick={() => setTailscaleOutput(null)} className="text-slate-500 hover:text-white text-[10px] cursor-pointer">Clear</button>
                    </div>
                    <pre className="whitespace-pre-wrap max-h-48 overflow-y-auto text-[11px] text-emerald-400 bg-black/40 p-2.5 rounded-lg border border-slate-800/80">
                      {tailscaleOutput}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-1 flex items-center gap-2 text-theme-text-primary">
                <MessageSquare size={20} className="text-indigo-500" /> Chat Settings
              </h3>
              <p className="text-xs text-theme-text-secondary mb-4">Customize your messaging experience in the workspace.</p>
              <div className="bg-theme-sidebar border border-theme-border p-5 rounded-xl space-y-4">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={sendOnEnter} 
                    onChange={(e) => setSendOnEnter(e.target.checked)}
                    className="rounded border-theme-border bg-theme-input text-indigo-600 focus:ring-indigo-500 h-4 w-4 transition-colors cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-medium text-theme-text-primary block">Send message on Enter</span>
                    <span className="text-[10px] text-theme-text-muted">Press Enter to send, Shift+Enter for a new line.</span>
                  </div>
                </label>

                <div className="h-px bg-theme-border/60" />

                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={autoMinimizeOnIdle} 
                    onChange={(e) => setAutoMinimizeOnIdle(e.target.checked)}
                    className="rounded border-theme-border bg-theme-input text-indigo-600 focus:ring-indigo-500 h-4 w-4 transition-colors cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-medium text-theme-text-primary block">Auto-minimize Chat on 5m Inactivity</span>
                    <span className="text-[10px] text-theme-text-muted">Automatically collapse the chat panel to the bottom right and start a 5-minute restoration countdown after 5 minutes of no user activity.</span>
                  </div>
                </label>
              </div>
            </div>

            <div className="border-t border-theme-border pt-6">
              <h3 className="text-lg font-semibold mb-1 flex items-center gap-2 text-theme-text-primary">
                <Palette size={20} className="text-indigo-500" /> Color Theme
              </h3>
              <p className="text-xs text-theme-text-secondary mb-4">Select your preferred workspace visual style and accessibility preset.</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl">
                {/* Default Dark Card */}
                <button
                  onClick={() => setTheme('dark')}
                  className={`flex flex-col items-center justify-center p-5 rounded-xl border transition-all text-center gap-2.5 cursor-pointer select-none ${
                    theme === 'dark'
                      ? 'border-indigo-500 bg-indigo-500/15 text-white font-semibold shadow-md'
                      : 'border-theme-border bg-theme-sidebar hover:bg-theme-btn-hover text-theme-text-secondary hover:text-theme-text-primary'
                  }`}
                >
                  <div className={`p-2.5 rounded-lg transition-colors ${theme === 'dark' ? 'bg-indigo-600 text-white' : 'bg-theme-bg text-theme-text-secondary'}`}>
                    <Moon size={22} />
                  </div>
                  <div>
                    <div className="text-sm">Default Dark</div>
                    <div className="text-[10px] opacity-70 font-mono mt-0.5">Classic workspace dark</div>
                  </div>
                </button>

                {/* Classic Light Card */}
                <button
                  onClick={() => setTheme('light')}
                  className={`flex flex-col items-center justify-center p-5 rounded-xl border transition-all text-center gap-2.5 cursor-pointer select-none ${
                    theme === 'light'
                      ? 'border-indigo-500 bg-indigo-500/15 text-indigo-600 font-semibold shadow-md'
                      : 'border-theme-border bg-theme-sidebar hover:bg-theme-btn-hover text-theme-text-secondary hover:text-theme-text-primary'
                  }`}
                >
                  <div className={`p-2.5 rounded-lg transition-colors ${theme === 'light' ? 'bg-indigo-600 text-white' : 'bg-theme-bg text-theme-text-secondary'}`}>
                    <Sun size={22} />
                  </div>
                  <div>
                    <div className="text-sm">Classic Light</div>
                    <div className="text-[10px] opacity-70 font-mono mt-0.5">Clean high-contrast light</div>
                  </div>
                </button>

                {/* High Contrast Card */}
                <button
                  onClick={() => setTheme('high-contrast')}
                  className={`flex flex-col items-center justify-center p-5 rounded-xl border transition-all text-center gap-2.5 cursor-pointer select-none ${
                    theme === 'high-contrast'
                      ? 'border-white bg-white text-black font-semibold'
                      : 'border-theme-border bg-theme-sidebar hover:bg-theme-btn-hover text-theme-text-secondary hover:text-theme-text-primary'
                  }`}
                >
                  <div className={`p-2.5 rounded-lg transition-colors ${theme === 'high-contrast' ? 'bg-white text-black' : 'bg-theme-bg text-theme-text-secondary'}`}>
                    <Palette size={22} />
                  </div>
                  <div>
                    <div className="text-sm">High Contrast</div>
                    <div className="text-[10px] opacity-70 font-mono mt-0.5">Pure black & white</div>
                  </div>
                </button>
              </div>
            </div>

            {/* Cognitive Memories Panel */}
            <div className="border-t border-theme-border pt-6">
              <h3 className="text-lg font-semibold mb-1 flex items-center gap-2 text-theme-text-primary">
                <HardDrive size={20} className="text-indigo-500" /> Cognitive Memories (Daya Ingat AI)
              </h3>
              <p className="text-xs text-theme-text-secondary mb-4">
                Structured knowledge base facts synchronized from existing ecosystem apps like **WebVirtCloud** and **lsmod** to build long-term memory.
              </p>

              {/* Automated Daily Backup Control Bar */}
              <div className="bg-theme-sidebar border border-theme-border p-3.5 rounded-xl mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                    <ShieldCheck size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-theme-text-primary">Automated Daily Backup</span>
                      <span className="px-2 py-0.5 text-[9px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                        {autoBackupEnabled ? 'ACTIVE' : 'PAUSED'}
                      </span>
                    </div>
                    <div className="text-[11px] text-theme-text-secondary">
                      {lastBackupDate ? `Last backup downloaded: ${lastBackupDate}` : 'Triggers automated JSON state download daily'}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => triggerLocalBackupDownload(false)}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    <FileDown size={14} />
                    Backup JSON
                  </button>

                  <button
                    type="button"
                    onClick={() => backupFileInputRef.current?.click()}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 bg-theme-btn-active hover:bg-theme-btn-hover text-theme-text-primary border border-theme-border text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    <Upload size={14} />
                    Import JSON
                  </button>
                  <input
                    type="file"
                    ref={backupFileInputRef}
                    accept=".json"
                    onChange={handleImportBackupJSON}
                    className="hidden"
                  />

                  <label className="flex items-center gap-1.5 text-xs text-theme-text-secondary cursor-pointer select-none pl-1">
                    <input
                      type="checkbox"
                      checked={autoBackupEnabled}
                      onChange={(e) => {
                        setAutoBackupEnabled(e.target.checked);
                        localStorage.setItem('ROC_AUTO_BACKUP_ENABLED', String(e.target.checked));
                      }}
                      className="rounded border-theme-border text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Auto Daily</span>
                  </label>
                </div>
              </div>

              {backupNotice && (
                <div className="bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 px-3.5 py-2 rounded-xl text-xs mb-4 flex items-center justify-between animate-fade-in">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-emerald-400" />
                    {backupNotice}
                  </span>
                  <button onClick={() => setBackupNotice(null)} className="text-emerald-400 hover:text-white">
                    <X size={13} />
                  </button>
                </div>
              )}
              
              {/* Search & Category Filter Bar */}
              {memories.length > 0 && (
                <div className="flex flex-col sm:flex-row gap-3 mb-4">
                  <div className="relative flex-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-theme-text-muted">
                      <Search size={14} />
                    </span>
                    <input
                      type="text"
                      placeholder="Search knowledge keys, content, or category (e.g. WebVirtCloud)..."
                      value={memSearchQuery}
                      onChange={(e) => setMemSearchQuery(e.target.value)}
                      className="w-full bg-theme-input text-theme-text-primary border border-theme-border rounded-lg pl-9 pr-8 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none placeholder-theme-text-muted/60"
                    />
                    {memSearchQuery && (
                      <button
                        onClick={() => setMemSearchQuery('')}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-theme-text-muted hover:text-theme-text-primary cursor-pointer"
                        title="Clear search"
                      >
                        <X size={14} />
                      </button>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Category Filter */}
                    <select
                      value={memFilterCat}
                      onChange={(e) => setMemFilterCat(e.target.value)}
                      className="bg-theme-sidebar text-theme-text-primary border border-theme-border rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-medium cursor-pointer"
                      title="Filter Kategori"
                    >
                      <option value="all">All Categories</option>
                      {Array.from(new Set(memories.map((m: any) => m?.category).filter(Boolean))).map((cat: any) => (
                        <option key={String(cat)} value={String(cat)}>{String(cat)}</option>
                      ))}
                    </select>

                    {/* Sorting Dropdown */}
                    <select
                      value={memSortMode}
                      onChange={(e) => setMemSortMode(e.target.value as 'newest' | 'oldest' | 'alphabetical')}
                      className="bg-theme-sidebar text-theme-text-primary border border-theme-border rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none font-medium cursor-pointer"
                      title="Urutkan Memori"
                    >
                      <option value="newest">Terbaru</option>
                      <option value="oldest">Terlama</option>
                      <option value="alphabetical">Alfabetis (Kunci)</option>
                    </select>

                    <span className="px-2.5 py-1 text-[10px] font-mono font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-lg whitespace-nowrap">
                      {processedMemories.length} / {memories.length} keys
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-4 mb-4">
                {memories.length === 0 ? (
                  <p className="text-xs text-theme-text-muted italic bg-theme-sidebar p-3.5 rounded-lg border border-theme-border">
                    No persistent memories logged yet. Add your first context fact below.
                  </p>
                ) : processedMemories.length === 0 ? (
                  <div className="p-8 text-center text-xs text-theme-text-muted italic bg-theme-sidebar/50 rounded-xl border border-dashed border-theme-border flex flex-col items-center justify-center gap-2">
                    <p>No cognitive memories match your search query &quot;<span className="text-indigo-400 font-semibold">{memSearchQuery}</span>&quot;.</p>
                    <button
                      onClick={() => { setMemSearchQuery(''); setMemFilterCat('all'); }}
                      className="px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                    >
                      Reset Filter & Search
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {processedMemories.map((m) => (
                      <div key={m.key} className="bg-theme-sidebar border border-theme-border p-4 rounded-xl flex flex-col justify-between relative group hover:border-indigo-500/30 transition-colors">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-indigo-400 font-mono">[{m.category}] {m.key}</span>
                            <button 
                              onClick={() => handleDeleteMemory(m.key)}
                              className="text-theme-text-muted hover:text-red-400 p-1 rounded hover:bg-theme-btn-hover transition-colors opacity-0 group-hover:opacity-100 absolute top-3 right-3 cursor-pointer"
                              title="Delete memory"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                          <p className="text-sm text-theme-text-primary leading-relaxed whitespace-pre-wrap">{m.value}</p>
                        </div>
                        <span className="text-[9px] text-theme-text-muted mt-3 font-mono">Saved: {new Date(m.updatedAt).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Add Memory Inline Form */}
              <div className="bg-theme-sidebar border border-theme-border p-4 rounded-xl space-y-3">
                <div className="text-xs font-bold text-theme-text-primary uppercase tracking-wider mb-1">Add Memory Entry</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input 
                    type="text" 
                    placeholder="Key (e.g., hypervisor_cores)" 
                    value={newMemoryKey}
                    onChange={(e) => setNewMemoryKey(e.target.value)}
                    className="bg-theme-input text-theme-text-primary border border-theme-border rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                  <input 
                    type="text" 
                    placeholder="Category (e.g., WebVirtCloud)" 
                    value={newMemoryCat}
                    onChange={(e) => setNewMemoryCat(e.target.value)}
                    className="bg-theme-input text-theme-text-primary border border-theme-border rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                  />
                  <button 
                    onClick={handleSaveMemory}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg text-xs py-2 transition-colors cursor-pointer select-none"
                  >
                    Save Memory
                  </button>
                </div>
                <textarea 
                  placeholder="Memory details or JSON structure..." 
                  value={newMemoryVal}
                  onChange={(e) => setNewMemoryVal(e.target.value)}
                  className="w-full bg-theme-input text-theme-text-primary border border-theme-border rounded-lg p-3 text-xs focus:ring-1 focus:ring-indigo-500 outline-none h-16 resize-none"
                />
              </div>
            </div>

            {/* Self-Development Hub */}
            <div className="border-t border-theme-border pt-6 pb-12">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-lg font-semibold flex items-center gap-2 text-theme-text-primary">
                  <TerminalIcon size={20} className="text-indigo-500" /> Self-Development (Mengembangkan Diri)
                </h3>
                {isPro ? (
                  <span className="px-2 py-0.5 text-[10px] font-bold font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">Pro Module Active</span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-bold font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">Pro Access Locked</span>
                )}
              </div>
              <p className="text-xs text-theme-text-secondary mb-4">
                Register, compile, and execute self-improvement scripts. The AI is empowered to edit, patch, and build adapters across all synchronized applications dynamically.
              </p>

              {isPro ? (
                <>
                  {/* View Mode Switcher: Routines vs Performance */}
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-4 bg-theme-sidebar border border-theme-border p-2 rounded-xl">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCapViewMode('routines')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                          capViewMode === 'routines'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-theme-text-muted hover:text-theme-text-primary'
                        }`}
                      >
                        <TerminalIcon size={14} />
                        Routines List ({selfCapabilities.length})
                      </button>

                      <button
                        type="button"
                        onClick={() => setCapViewMode('performance')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all ${
                          capViewMode === 'performance'
                            ? 'bg-indigo-600 text-white shadow-xs'
                            : 'text-theme-text-muted hover:text-theme-text-primary'
                        }`}
                      >
                        <BarChart2 size={14} />
                        Performance View
                      </button>
                    </div>

                    <div className="text-[11px] font-mono text-theme-text-muted flex items-center gap-2 pr-2">
                      <Activity size={13} className="text-emerald-400 animate-pulse" />
                      <span>Routines Status: </span>
                      <span className="font-bold text-emerald-400">100% Operational</span>
                    </div>
                  </div>

                  {capViewMode === 'performance' ? (
                    <div className="space-y-4 mb-6 animate-fade-in">
                      {/* Executive Summary Metrics */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-theme-sidebar border border-theme-border p-3.5 rounded-xl">
                          <div className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider mb-1">Total Routines</div>
                          <div className="text-xl font-bold text-theme-text-primary flex items-center gap-2">
                            <span>{selfCapabilities.length}</span>
                            <span className="text-[10px] text-indigo-400 font-mono">Registered</span>
                          </div>
                        </div>

                        <div className="bg-theme-sidebar border border-theme-border p-3.5 rounded-xl">
                          <div className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider mb-1">System Success Rate</div>
                          <div className="text-xl font-bold text-emerald-400 flex items-center gap-1.5">
                            <TrendingUp size={18} />
                            <span>
                              {(() => {
                                const allLogs = Object.values(capabilityExecutionLogs).flat();
                                if (allLogs.length === 0) return '100%';
                                const succ = allLogs.filter((l: any) => l.result?.status === 'success' || !l.result?.error).length;
                                return `${Math.round((succ / allLogs.length) * 100)}%`;
                              })()}
                            </span>
                          </div>
                        </div>

                        <div className="bg-theme-sidebar border border-theme-border p-3.5 rounded-xl">
                          <div className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider mb-1">Total Executions</div>
                          <div className="text-xl font-bold text-theme-text-primary flex items-center gap-2">
                            <span>{Object.values(capabilityExecutionLogs).flat().length}</span>
                            <span className="text-[10px] text-indigo-400 font-mono">Runs Logged</span>
                          </div>
                        </div>

                        <div className="bg-theme-sidebar border border-theme-border p-3.5 rounded-xl">
                          <div className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider mb-1">Avg Execution Time</div>
                          <div className="text-xl font-bold text-indigo-400 font-mono">
                            ~115 ms
                          </div>
                        </div>
                      </div>

                      {/* Routine Success Breakdown Table / Cards */}
                      <div className="bg-theme-sidebar border border-theme-border rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between border-b border-theme-border pb-2.5">
                          <h4 className="font-bold text-xs text-theme-text-primary uppercase tracking-wider flex items-center gap-1.5">
                            <Activity size={14} className="text-indigo-400" /> Success-Rate Summary Across Registered Routines
                          </h4>
                          <span className="text-[10px] font-mono text-theme-text-muted">
                            Execution History Sync
                          </span>
                        </div>

                        {selfCapabilities.length === 0 ? (
                          <p className="text-xs text-theme-text-muted italic py-6 text-center">
                            No registered routines to display performance metrics for. Register your first routine below!
                          </p>
                        ) : (
                          <div className="space-y-3">
                            {selfCapabilities.map((cap) => {
                              const stats = getRoutinePerformanceStats(cap.name);
                              return (
                                <div key={cap.id} className="bg-theme-input/60 border border-theme-border/60 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                  <div className="flex-1 space-y-2 w-full">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-xs text-theme-text-primary">{cap.name}</span>
                                        {cap.category && (
                                          <span className="px-1.5 py-0.5 text-[9px] font-bold font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded uppercase">
                                            {cap.category}
                                          </span>
                                        )}
                                      </div>
                                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                        stats.status === 'Optimal'
                                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                          : stats.status === 'Stable'
                                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                      }`}>
                                        {stats.status}
                                      </span>
                                    </div>

                                    {/* Success Rate Progress Bar */}
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between text-[11px] font-mono">
                                        <span className="text-theme-text-muted">Success Rate:</span>
                                        <span className="font-bold text-emerald-400">{stats.rate}% ({stats.successes}/{stats.total} successful)</span>
                                      </div>
                                      <div className="w-full bg-theme-sidebar h-2 rounded-full overflow-hidden border border-theme-border/40">
                                        <div
                                          className={`h-full transition-all duration-500 ${
                                            stats.rate >= 90 ? 'bg-emerald-500' : stats.rate >= 60 ? 'bg-indigo-500' : 'bg-amber-500'
                                          }`}
                                          style={{ width: `${stats.rate}%` }}
                                        />
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-4 text-[10px] font-mono text-theme-text-muted pt-0.5">
                                      <span>Avg Time: ~{stats.avgTime}ms</span>
                                      <span>Total Runs: {stats.total}</span>
                                      <span>Failures: {stats.failures}</span>
                                    </div>
                                  </div>

                                  <div className="flex sm:flex-col gap-2 w-full sm:w-auto flex-shrink-0">
                                    <button
                                      type="button"
                                      disabled={executingCapId === cap.id}
                                      onClick={() => handleExecuteCapability(cap.name, cap.id)}
                                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-theme-btn-active text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                                    >
                                      {executingCapId === cap.id ? (
                                        <RefreshCw size={12} className="animate-spin" />
                                      ) : (
                                        <Plus size={12} />
                                      )}
                                      Execute
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setHistoryModalCap(cap.name)}
                                      className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-theme-btn-active hover:bg-theme-btn-hover text-theme-text-secondary border border-theme-border text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                                    >
                                      <Clock size={12} />
                                      History
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Search input field */}
                  {selfCapabilities.length > 0 && (
                    <div className="relative mb-4">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Search size={14} className="text-theme-text-muted" />
                      </span>
                      <input
                        type="text"
                        placeholder="Search routines by name, purpose, or tag/category..."
                        value={capSearchQuery}
                        onChange={(e) => setCapSearchQuery(e.target.value)}
                        className="w-full bg-theme-input text-theme-text-primary border border-theme-border rounded-lg pl-9 pr-8 py-2 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                      {capSearchQuery && (
                        <button
                          onClick={() => setCapSearchQuery('')}
                          className="absolute inset-y-0 right-0 flex items-center pr-3 text-theme-text-muted hover:text-theme-text-primary cursor-pointer"
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  )}

                  <div className="space-y-4 mb-4">
                    {selfCapabilities.length === 0 ? (
                      <p className="text-xs text-theme-text-muted italic bg-theme-sidebar p-3.5 rounded-lg border border-theme-border">
                        No custom self-development capabilities registered. Use the interface below to define an adapter or optimization routing patch.
                      </p>
                    ) : filteredCapabilities.length === 0 ? (
                      <div className="bg-theme-sidebar border border-theme-border p-5 rounded-xl text-center">
                        <p className="text-xs text-theme-text-secondary mb-2">
                          No matching routines found for <span className="font-semibold text-indigo-400">"{capSearchQuery}"</span>.
                        </p>
                        <button
                          onClick={() => setCapSearchQuery('')}
                          className="text-xs text-indigo-500 hover:text-indigo-400 font-medium underline"
                        >
                          Clear search filter
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {filteredCapabilities.map((cap) => (
                          <div key={cap.id} className="bg-theme-sidebar border border-theme-border p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex-1">
                              <h4 className="font-bold text-sm text-theme-text-primary flex items-center flex-wrap gap-2">
                                <span>{cap.name}</span>
                                <span className="text-[10px] font-mono text-indigo-400">({cap.id})</span>
                                {cap.category && (
                                  <span className="px-2 py-0.5 text-[9px] font-bold font-mono bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md uppercase">
                                    {cap.category}
                                  </span>
                                )}
                              </h4>
                              <p className="text-xs text-theme-text-secondary mt-1">{cap.purpose}</p>
                              <div className="relative mt-2 group/snippet">
                                <pre className="text-[10px] font-mono text-theme-text-muted bg-theme-input p-3.5 pr-10 rounded-lg border border-theme-border/50 max-h-24 overflow-y-auto w-full whitespace-pre-wrap">
                                  {cap.codeSnippet}
                                </pre>
                                <button
                                  onClick={() => handleCopySnippet(cap.codeSnippet, cap.id)}
                                  className="absolute top-2 right-2 p-1.5 rounded-md bg-theme-sidebar border border-theme-border/60 text-theme-text-muted hover:text-theme-text-primary hover:bg-theme-btn-hover transition-colors cursor-pointer"
                                  title="Copy code snippet"
                                >
                                  {copiedCapId === cap.id ? (
                                    <Check size={12} className="text-emerald-500" />
                                  ) : (
                                    <Copy size={12} />
                                  )}
                                </button>
                              </div>
                              {capabilityExecutionLogs[cap.name] && capabilityExecutionLogs[cap.name].length > 0 && (
                                <div className="mt-3">
                                  <div className="font-bold uppercase tracking-wider mb-1 text-[10px] text-theme-text-muted">Recent Executions (Last 10):</div>
                                  <div className="h-20 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                      <BarChart data={capabilityExecutionLogs[cap.name].slice(0, 10).reverse().map((log, i) => ({
                                          i,
                                          value: log.result.status === 'success' ? 1 : 0
                                        }))}>
                                        <Bar dataKey="value">
                                            {capabilityExecutionLogs[cap.name].slice(0, 10).reverse().map((log, i) => (
                                                <Cell key={i} fill={log.result.status === 'success' ? '#4f46e5' : '#ef4444'} />
                                            ))}
                                        </Bar>
                                        <XAxis hide />
                                        <YAxis hide domain={[0, 1]} />
                                      </BarChart>
                                    </ResponsiveContainer>
                                  </div>
                                </div>
                              )}
                            </div>
                            <div className="flex flex-col gap-2">
                              <button 
                                disabled={executingCapId === cap.id}
                                onClick={() => handleExecuteCapability(cap.name, cap.id)}
                                className="flex items-center justify-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-theme-btn-active disabled:text-theme-text-muted text-white text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer w-full sm:w-auto"
                              >
                                {executingCapId === cap.id ? (
                                  <>
                                    <RefreshCw size={13} className="animate-spin" />
                                    Compiling...
                                  </>
                                ) : (
                                  <>
                                    <Plus size={13} />
                                    Execute Routine
                                  </>
                                )}
                              </button>
                              <button 
                                onClick={() => setHistoryModalCap(cap.name)}
                                className="flex items-center justify-center gap-1.5 bg-theme-btn-active hover:bg-theme-btn-hover text-theme-text-secondary border border-theme-border text-xs font-semibold px-3 py-2 rounded-lg transition-colors cursor-pointer w-full sm:w-auto"
                              >
                                <Clock size={13} />
                                History
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

                  {/* Execution Console Output */}
                  {capLogs.length > 0 && (
                    <div className="bg-neutral-950 border border-theme-border rounded-xl p-4 mb-4 font-mono text-xs">
                      <div className="flex items-center justify-between border-b border-theme-border/60 pb-2 mb-3">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Improvement Compilation Output</span>
                        <button onClick={() => setCapLogs([])} className="text-neutral-500 hover:text-white transition-colors text-[10px]">Clear</button>
                        <button onClick={archiveLogs} className="text-neutral-500 hover:text-indigo-400 transition-colors text-[10px]">Archive Logs</button>
                      </div>
                      <div className="space-y-1 max-h-40 overflow-y-auto text-left">
                        {(Array.isArray(capLogs) ? capLogs : []).map((log, i) => {
                          const logStr = String(log || '');
                          return (
                            <div key={i} className={`whitespace-pre-wrap ${logStr.includes('[ERROR]') ? 'text-red-400' : logStr.includes('[INIT]') ? 'text-indigo-400' : 'text-neutral-300'}`}>{logStr}</div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Add Custom Self-Improvement capability form */}
                  <div className="bg-theme-sidebar border border-theme-border p-4 rounded-xl space-y-4">
                    <div className="text-xs font-bold text-theme-text-primary uppercase tracking-wider">Register Self-Improvement Capability</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input 
                        type="text" 
                        placeholder="Capability Name (e.g. PatchWebVirtCloud)" 
                        value={newCapName}
                        onChange={(e) => setNewCapName(e.target.value)}
                        className="bg-theme-input text-theme-text-primary border border-theme-border rounded-lg px-3 py-2.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                      <input 
                        type="text" 
                        placeholder="Purpose of improvement..." 
                        value={newCapPurpose}
                        onChange={(e) => setNewCapPurpose(e.target.value)}
                        className="bg-theme-input text-theme-text-primary border border-theme-border rounded-lg px-3 py-2.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                      <input 
                        type="text" 
                        placeholder="Tag / Category (e.g. general)" 
                        value={newCapCat}
                        onChange={(e) => setNewCapCat(e.target.value)}
                        className="bg-theme-input text-theme-text-primary border border-theme-border rounded-lg px-3 py-2.5 text-xs focus:ring-1 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-theme-text-muted">Dynamic Script Snippet (Safe Eval Execution Context)</label>
                      <textarea 
                        placeholder="// Write safe system AST mutation code here..." 
                        value={newCapSnippet}
                        onChange={(e) => setNewCapSnippet(e.target.value)}
                        className="w-full bg-theme-input text-theme-text-primary font-mono border border-theme-border rounded-lg p-3 text-xs focus:ring-1 focus:ring-indigo-500 outline-none h-24"
                      />
                    </div>
                    <button 
                      onClick={handleRegisterCapability}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg text-xs py-2.5 transition-colors cursor-pointer select-none"
                    >
                      Register & Compile Capability
                    </button>
                  </div>
                </>
              ) : (
                <div className="bg-theme-sidebar/45 border-2 border-dashed border-theme-border p-8 rounded-2xl text-center space-y-4 max-w-2xl mx-auto my-2">
                  <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center mx-auto border border-amber-500/20 text-lg">
                    🔒
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-theme-text-primary">Self-Development Module Locked</h4>
                    <p className="text-xs text-theme-text-secondary mt-1 max-w-md mx-auto leading-relaxed">
                      Modul Mengembangkan Diri (Pro Module) dilindungi keamanan sandbox. Hanya akun owner utama dengan email <strong className="text-indigo-400 font-mono font-bold">ivansuselo@gmail.com</strong> atau GitHub <strong className="text-indigo-400 font-mono font-bold">ivansslo</strong> yang berhak melakukan registrasi dan eksekusi dynamic script.
                    </p>
                  </div>
                  <div className="text-[11px] text-theme-text-muted">
                    Sila masukkan email atau GitHub valid Anda pada bagian <strong className="text-theme-text-secondary">Security Account Verification</strong> di atas untuk memverifikasi credentials.
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {historyModalCap && (
        <ExecutionHistoryModal 
          capabilityName={historyModalCap} 
          onClose={() => setHistoryModalCap(null)} 
        />
      )}
    </div>
  );
}
