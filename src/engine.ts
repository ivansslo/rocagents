import {
  BackupData,
  CognitiveMemory,
  Capability,
  ExecutionLog,
  OptimizationRecommendation,
  SecurityFinding,
  ServiceHealth,
} from './types.js';
import { MemoryManager } from './capabilities/memory-manager.js';
import { SystemOptimizer } from './capabilities/system-optimizer.js';
import { HealthChecker } from './capabilities/health-checker.js';
import { SecurityAuditor } from './capabilities/security-auditor.js';
import { CapabilityRegistry } from './capabilities/index.js';
import { Redactor } from './redactor.js';

// ============================================================
// RoC Engine - Main orchestrator
// ============================================================

export class RoCEngine {
  private memoryManager: MemoryManager;
  private optimizer: SystemOptimizer;
  private healthChecker: HealthChecker;
  private securityAuditor: SecurityAuditor;
  private registry: CapabilityRegistry;
  private redactor: Redactor;

  constructor(backupData?: BackupData) {
    this.memoryManager = new MemoryManager(backupData?.data?.cognitiveMemories || []);
    this.optimizer = new SystemOptimizer();
    this.healthChecker = new HealthChecker();
    this.securityAuditor = new SecurityAuditor();
    this.registry = new CapabilityRegistry();
    this.redactor = new Redactor();

    this.registerDefaultCapabilities();
  }

  // --- Memory Operations ---

  storeMemory(key: string, value: string, category: string): CognitiveMemory {
    return this.memoryManager.store(key, value, category);
  }

  getMemory(key: string): CognitiveMemory | null {
    return this.memoryManager.retrieve(key);
  }

  listMemories(category?: string): CognitiveMemory[] {
    return this.memoryManager.list(category);
  }

  removeMemory(key: string): boolean {
    return this.memoryManager.remove(key);
  }

  searchMemories(query: string): CognitiveMemory[] {
    return this.memoryManager.search(query);
  }

  // --- Analysis ---

  analyzeSystem(): OptimizationRecommendation[] {
    const memories = this.memoryManager.export();
    return this.optimizer.analyze(memories);
  }

  auditSecurity(): SecurityFinding[] {
    const memories = this.memoryManager.export();
    return this.securityAuditor.scan(memories);
  }

  async checkServiceHealth(
    endpoints: { url?: string; host?: string; port?: number }[]
  ): Promise<ServiceHealth[]> {
    return this.healthChecker.checkAll(endpoints);
  }

  // --- Redaction ---

  redactText(text: string) {
    return this.redactor.redact(text);
  }

  // --- Backup ---

  exportBackup(): BackupData {
    return {
      version: '2.0',
      backupType: 'RoC Engine Export',
      backupDate: new Date().toISOString().split('T')[0],
      timestamp: new Date().toISOString(),
      system: 'RoC Agent Workspace (Refactored)',
      data: {
        cognitiveMemories: this.memoryManager.export(),
        selfCapabilities: this.registry.list(),
        capabilityExecutionLogs: this.logsToMap(this.registry.getLogs()),
      },
    };
  }

  // --- Capability Registry ---

  registerCapability(meta: Capability, handler: { execute: (input?: unknown) => Promise<unknown> }): void {
    this.registry.register(meta, handler);
  }

  async executeCapability(id: string, input?: unknown): Promise<ExecutionLog> {
    return this.registry.execute(id, input);
  }

  // --- Health ---

  validateIntegrity(): { valid: boolean; errors: string[] } {
    return this.memoryManager.validate();
  }

  getStats(): {
    memories: number;
    categories: string[];
    capabilities: number;
    activeCapabilities: number;
  } {
    const caps = this.registry.list();
    return {
      memories: this.memoryManager.size,
      categories: this.memoryManager.getCategories(),
      capabilities: caps.length,
      activeCapabilities: caps.filter((c) => c.active).length,
    };
  }

  // --- Private ---

  private registerDefaultCapabilities(): void {
    this.registry.register(
      {
        id: 'memory-validate',
        name: 'Memory Validation',
        codeSnippet: '',
        purpose: 'Validate integrity of all stored memories',
        category: 'System',
        active: true,
      },
      {
        execute: async () => this.memoryManager.validate(),
      }
    );

    this.registry.register(
      {
        id: 'system-analyze',
        name: 'System Analysis',
        codeSnippet: '',
        purpose: 'Analyze system state and generate recommendations',
        category: 'System',
        active: true,
      },
      {
        execute: async () => this.analyzeSystem(),
      }
    );

    this.registry.register(
      {
        id: 'security-audit',
        name: 'Security Audit',
        codeSnippet: '',
        purpose: 'Scan for sensitive data exposure',
        category: 'Security',
        active: true,
      },
      {
        execute: async () => this.auditSecurity(),
      }
    );
  }

  private logsToMap(logs: ExecutionLog[]): Record<string, ExecutionLog> {
    const map: Record<string, ExecutionLog> = {};
    for (const log of logs) {
      map[`${log.capabilityId}_${log.timestamp}`] = log;
    }
    return map;
  }
}
