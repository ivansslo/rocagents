// ============================================================
// RoC Agent Types - Refactored
// ============================================================

// --- Core Memory Types ---

export interface CognitiveMemory {
  key: string;
  value: string;
  category: string;
  updatedAt: string;
}

export interface BackupData {
  version: string;
  backupType: string;
  backupDate: string;
  timestamp: string;
  system: string;
  data: {
    cognitiveMemories: CognitiveMemory[];
    selfCapabilities: Capability[];
    capabilityExecutionLogs: Record<string, ExecutionLog>;
  };
}

// --- Capability Types ---

export type CapabilityStatus = 'active' | 'inactive' | 'error';

export interface Capability {
  id: string;
  name: string;
  codeSnippet: string;
  purpose: string;
  category: string;
  active: boolean;
}

export interface ExecutionLog {
  timestamp: string;
  capabilityId: string;
  input?: unknown;
  output?: unknown;
  success: boolean;
  error?: string;
  durationMs: number;
}

// --- System Types ---

export type ServiceName = 'neon' | 'oci' | 'tailscale' | 'backboard' | 'honcho';

export interface ServiceHealth {
  service: ServiceName;
  status: 'online' | 'offline' | 'degraded' | 'unknown';
  lastChecked: string;
  responseMs?: number;
  error?: string;
}

export interface SystemConfig {
  neonEndpoint?: string;
  neonApiKey?: string;
  ociIpAddress?: string;
  tailscaleApiKey?: string;
  backboardApiKey?: string;
  honchoApiKey?: string;
}

// --- Audit Types ---

export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface SecurityFinding {
  id: string;
  severity: SeverityLevel;
  category: string;
  message: string;
  location: string;
  recommendation: string;
}

// --- Optimizer Types ---

export interface OptimizationRecommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
}
