import { CognitiveMemory, SecurityFinding } from '../types.js';

// ============================================================
// SecurityAuditor - Real sensitive data scanning
// ============================================================

export class SecurityAuditor {
  private findingIdCounter = 0;

  scan(memories: CognitiveMemory[]): SecurityFinding[] {
    const findings: SecurityFinding[] = [];

    for (const memory of memories) {
      findings.push(...this.scanValue(memory));
    }

    return findings;
  }

  scanText(text: string, source: string = 'inline'): SecurityFinding[] {
    const findings: SecurityFinding[] = [];

    for (const rule of this.getRules()) {
      const matches = text.matchAll(rule.pattern);
      for (const match of matches) {
        findings.push({
          id: this.nextId(),
          severity: rule.severity,
          category: rule.category,
          message: rule.description,
          location: `${source} (match: "${match[0].substring(0, 20)}...")`,
          recommendation: rule.recommendation,
        });
      }
    }

    return findings;
  }

  getSummary(findings: SecurityFinding[]): {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  } {
    const summary = { total: findings.length, critical: 0, high: 0, medium: 0, low: 0, info: 0 };
    for (const f of findings) {
      summary[f.severity]++;
    }
    return summary;
  }

  // --- Private ---

  private scanValue(memory: CognitiveMemory): SecurityFinding[] {
    const findings: SecurityFinding[] = [];
    const combined = `${memory.key} ${memory.value}`;
    const source = `memory[${memory.key}]`;

    for (const rule of this.getRules()) {
      const matches = combined.matchAll(rule.pattern);
      for (const match of matches) {
        findings.push({
          id: this.nextId(),
          severity: rule.severity,
          category: rule.category,
          message: rule.description,
          location: `${source} (match: "${match[0].substring(0, 20)}...")`,
          recommendation: rule.recommendation,
        });
      }
    }

    return findings;
  }

  private getRules(): ScanRule[] {
    return [
      {
        pattern: /sk-[a-zA-Z0-9]{20,}/g,
        severity: 'critical',
        category: 'API Key',
        description: 'OpenAI API key detected',
        recommendation: 'Remove from storage, rotate key immediately',
      },
      {
        pattern: /ghp_[a-zA-Z0-9]{36,}/g,
        severity: 'critical',
        category: 'API Key',
        description: 'GitHub Personal Access Token detected',
        recommendation: 'Remove from storage, rotate token immediately',
      },
      {
        pattern: /Bearer\s+[a-zA-Z0-9_\-\.]+/g,
        severity: 'critical',
        category: 'Auth Token',
        description: 'Bearer token detected',
        recommendation: 'Remove from storage, rotate token',
      },
      {
        pattern: /password\s*[:=]\s*\S+/gi,
        severity: 'high',
        category: 'Credential',
        description: 'Password or credential detected',
        recommendation: 'Use environment variables instead',
      },
      {
        pattern: /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g,
        severity: 'medium',
        category: 'Network',
        description: 'IP address detected',
        recommendation: 'Consider if IP needs to be public, otherwise use private networking',
      },
      {
        pattern: /endpoint\s*[:=]\s*https?:\/\/[^\s,]+/gi,
        severity: 'medium',
        category: 'Infrastructure',
        description: 'Service endpoint URL detected',
        recommendation: 'Store endpoints in config files, not in memory',
      },
      {
        pattern: /api[_-]?key\s*[:=]\s*\S+/gi,
        severity: 'high',
        category: 'API Key',
        description: 'API key reference detected',
        recommendation: 'Move to environment variables',
      },
      {
        pattern: /token\s*[:=]\s*[a-zA-Z0-9_\-\.]{20,}/gi,
        severity: 'high',
        category: 'Auth Token',
        description: 'Token reference detected',
        recommendation: 'Move to environment variables or secret manager',
      },
    ];
  }

  private nextId(): string {
    return `sec_${Date.now()}_${++this.findingIdCounter}`;
  }
}

interface ScanRule {
  pattern: RegExp;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  category: string;
  description: string;
  recommendation: string;
}
