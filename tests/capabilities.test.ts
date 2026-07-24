import { MemoryManager } from '../src/capabilities/memory-manager.js';
import { SystemOptimizer } from '../src/capabilities/system-optimizer.js';
import { SecurityAuditor } from '../src/capabilities/security-auditor.js';
import { CapabilityRegistry } from '../src/capabilities/index.js';
import { Redactor } from '../src/redactor.js';

// ============================================================
// MemoryManager Tests
// ============================================================

describe('MemoryManager', () => {
  let manager: MemoryManager;

  beforeEach(() => {
    manager = new MemoryManager();
  });

  describe('store & retrieve', () => {
    it('should store and retrieve a memory', () => {
      manager.store('test-key', 'test-value', 'TestCat');
      const result = manager.retrieve('test-key');

      expect(result).not.toBeNull();
      expect(result!.key).toBe('test-key');
      expect(result!.value).toBe('test-value');
      expect(result!.category).toBe('TestCat');
    });

    it('should return null for non-existent key', () => {
      expect(manager.retrieve('non-existent')).toBeNull();
    });

    it('should update existing memory', () => {
      manager.store('key1', 'value1', 'Cat');
      manager.store('key1', 'value2', 'Cat');

      const result = manager.retrieve('key1');
      expect(result!.value).toBe('value2');
      expect(manager.size).toBe(1);
    });
  });

  describe('validation', () => {
    it('should reject empty key', () => {
      expect(() => manager.store('', 'value', 'Cat')).toThrow('key cannot be empty');
    });

    it('should reject empty value', () => {
      expect(() => manager.store('key', '', 'Cat')).toThrow('value cannot be empty');
    });

    it('should reject empty category', () => {
      expect(() => manager.store('key', 'value', '')).toThrow('category cannot be empty');
    });
  });

  describe('list & search', () => {
    beforeEach(() => {
      manager.store('k1', 'v1', 'CatA');
      manager.store('k2', 'v2', 'CatB');
      manager.store('k3', 'hello world', 'CatA');
    });

    it('should list all memories', () => {
      expect(manager.list()).toHaveLength(3);
    });

    it('should filter by category', () => {
      expect(manager.list('CatA')).toHaveLength(2);
    });

    it('should search by query', () => {
      const results = manager.search('hello');
      expect(results).toHaveLength(1);
      expect(results[0].key).toBe('k3');
    });
  });

  describe('remove', () => {
    it('should remove a memory', () => {
      manager.store('key', 'value', 'Cat');
      expect(manager.remove('key')).toBe(true);
      expect(manager.retrieve('key')).toBeNull();
    });

    it('should return false for non-existent key', () => {
      expect(manager.remove('nope')).toBe(false);
    });
  });

  describe('validate', () => {
    it('should validate all memories', () => {
      manager.store('k1', 'v1', 'Cat');
      const result = manager.validate();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('initialization', () => {
    it('should initialize with provided memories', () => {
      const initial = [
        { key: 'k1', value: 'v1', category: 'Cat', updatedAt: new Date().toISOString() },
      ];
      const mgr = new MemoryManager(initial);
      expect(mgr.size).toBe(1);
      expect(mgr.retrieve('k1')).not.toBeNull();
    });
  });
});

// ============================================================
// SystemOptimizer Tests
// ============================================================

describe('SystemOptimizer', () => {
  let optimizer: SystemOptimizer;

  beforeEach(() => {
    optimizer = new SystemOptimizer();
  });

  it('should detect oversized values', () => {
    const memories = [
      { key: 'k1', value: 'x'.repeat(6000), category: 'Cat', updatedAt: new Date().toISOString() },
    ];
    const recs = optimizer.analyze(memories);
    expect(recs.some((r) => r.title.includes('5000 chars'))).toBe(true);
  });

  it('should detect stale memories', () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 10);
    const memories = [
      { key: 'k1', value: 'v1', category: 'Cat', updatedAt: oldDate.toISOString() },
    ];
    const recs = optimizer.analyze(memories);
    expect(recs.some((r) => r.title.includes('older than'))).toBe(true);
  });

  it('should detect sensitive data patterns', () => {
    const memories = [
      { key: 'k1', value: 'sk-abc123def456ghi789jkl012', category: 'Cat', updatedAt: new Date().toISOString() },
    ];
    const recs = optimizer.analyze(memories);
    expect(recs.some((r) => r.category === 'Security')).toBe(true);
  });
});

// ============================================================
// SecurityAuditor Tests
// ============================================================

describe('SecurityAuditor', () => {
  let auditor: SecurityAuditor;

  beforeEach(() => {
    auditor = new SecurityAuditor();
  });

  it('should detect OpenAI API keys', () => {
    const findings = auditor.scanText('key is sk-abcdefghijklmnopqrstuvwxyz123456', 'test');
    expect(findings.some((f) => f.category === 'API Key' && f.severity === 'critical')).toBe(true);
  });

  it('should detect IP addresses', () => {
    const findings = auditor.scanText('server at 192.168.1.100', 'test');
    expect(findings.some((f) => f.category === 'Network')).toBe(true);
  });

  it('should provide accurate summary', () => {
    const findings = [
      { id: '1', severity: 'critical' as const, category: 'API', message: '', location: '', recommendation: '' },
      { id: '2', severity: 'high' as const, category: 'API', message: '', location: '', recommendation: '' },
      { id: '3', severity: 'low' as const, category: 'API', message: '', location: '', recommendation: '' },
    ];
    const summary = auditor.getSummary(findings);
    expect(summary.total).toBe(3);
    expect(summary.critical).toBe(1);
    expect(summary.high).toBe(1);
    expect(summary.low).toBe(1);
  });
});

// ============================================================
// Redactor Tests
// ============================================================

describe('Redactor', () => {
  let redactor: Redactor;

  beforeEach(() => {
    redactor = new Redactor();
  });

  it('should redact OpenAI API keys', () => {
    const result = redactor.redact('my key is sk-abc123def456ghi789jkl012mno');
    expect(result.redacted).toContain('[REDACTED]');
    expect(result.redactions.length).toBeGreaterThan(0);
  });

  it('should redact IP addresses', () => {
    const result = redactor.redact('host is 192.168.1.100');
    expect(result.redacted).toContain('X.X.X.X');
  });

  it('should detect sensitive text', () => {
    expect(redactor.isSensitive('sk-abc123def456ghi789jkl012mno')).toBe(true);
    expect(redactor.isSensitive('hello world')).toBe(false);
  });
});

// ============================================================
// CapabilityRegistry Tests
// ============================================================

describe('CapabilityRegistry', () => {
  let registry: CapabilityRegistry;

  beforeEach(() => {
    registry = new CapabilityRegistry();
  });

  it('should register and execute a capability', async () => {
    registry.register(
      { id: 'test-cap', name: 'Test', codeSnippet: '', purpose: 'test', category: 'Test', active: true },
      { execute: async (input) => `result: ${input}` }
    );

    const log = await registry.execute('test-cap', 'hello');
    expect(log.success).toBe(true);
    expect(log.output).toBe('result: hello');
  });

  it('should fail for non-existent capability', async () => {
    const log = await registry.execute('nope');
    expect(log.success).toBe(false);
    expect(log.error).toContain('not found');
  });

  it('should not execute disabled capability', async () => {
    registry.register(
      { id: 'test-cap', name: 'Test', codeSnippet: '', purpose: 'test', category: 'Test', active: false },
      { execute: async () => 'ok' }
    );

    const log = await registry.execute('test-cap');
    expect(log.success).toBe(false);
    expect(log.error).toContain('disabled');
  });
});
