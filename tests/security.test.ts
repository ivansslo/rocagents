import { Config, ConfigTemplate } from '../src/config.js';
import { BackupSanitizer } from '../src/backup-sanitizer.js';
import { readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

// ============================================================
// Config Tests
// ============================================================

describe('Config', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should load from environment variables', () => {
    process.env.NEON_ENDPOINT = 'test-endpoint';
    process.env.NEON_API_KEY = 'test-key';
    process.env.OCI_IP_ADDRESS = '1.2.3.4';

    const config = new Config();
    const values = config.get();

    expect(values.neonEndpoint).toBe('test-endpoint');
    expect(values.neonApiKey).toBe('test-key');
    expect(values.ociIpAddress).toBe('1.2.3.4');
  });

  it('should redact sensitive values', () => {
    process.env.NEON_API_KEY = 'sk-test12345678901234567890';

    const config = new Config();
    const redacted = config.getRedacted();

    expect(redacted.neonApiKey).toContain('REDACTED');
    expect(redacted.neonApiKey).not.toBe('neon_secret_key_12345');
  });

  it('should report missing required fields', () => {
    delete process.env.NEON_ENDPOINT;
    delete process.env.NEON_API_KEY;

    const config = new Config();
    const validation = config.validate();

    expect(validation.valid).toBe(false);
    expect(validation.missing).toContain('NEON_ENDPOINT');
    expect(validation.missing).toContain('NEON_API_KEY');
  });

  it('should validate when all required fields present', () => {
    process.env.NEON_ENDPOINT = 'ep-test';
    process.env.NEON_API_KEY = 'key-test';

    const config = new Config();
    const validation = config.validate();

    expect(validation.valid).toBe(true);
    expect(validation.missing).toHaveLength(0);
  });

  it('should detect configured state', () => {
    process.env.NEON_ENDPOINT = 'ep-test';

    const config = new Config();
    expect(config.isConfigured()).toBe(true);

    delete process.env.NEON_ENDPOINT;
    const emptyConfig = new Config();
    expect(emptyConfig.isConfigured()).toBe(false);
  });
});

describe('ConfigTemplate', () => {
  it('should generate valid .env template', () => {
    const template = ConfigTemplate.generate();

    expect(template).toContain('NEON_ENDPOINT=');
    expect(template).toContain('NEON_API_KEY=');
    expect(template).toContain('OCI_IP_ADDRESS=');
    expect(template).toContain('# NEVER commit');
  });

  it('should generate secure template with placeholders', () => {
    const template = ConfigTemplate.generateSecure();

    expect(template).toContain('ep-xxxxx');
    expect(template).toContain('0.0.0.0');
    expect(template).toContain('neon_api_key_here');
  });
});

// ============================================================
// BackupSanitizer Tests
// ============================================================

describe('BackupSanitizer', () => {
  let sanitizer: BackupSanitizer;
  const tmpFile = join(tmpdir(), `test-backup-${Date.now()}.json`);

  beforeAll(() => {
    sanitizer = new BackupSanitizer();

    // Create test backup with sensitive data
    const testBackup = {
      version: '1.0',
      backupType: 'test',
      backupDate: '2026-07-24',
      timestamp: new Date().toISOString(),
      system: 'Test System',
      data: {
        cognitiveMemories: [
          {
            key: 'api_test',
            value: 'endpoint is 192.168.1.100 with key sk-abc123def456ghi789jkl012',
            category: 'Test',
            updatedAt: new Date().toISOString(),
          },
          {
            key: 'clean_memory',
            value: 'This is a clean memory with no sensitive data',
            category: 'Test',
            updatedAt: new Date().toISOString(),
          },
        ],
        selfCapabilities: [],
        capabilityExecutionLogs: {},
      },
    };

    writeFileSync(tmpFile, JSON.stringify(testBackup, null, 2));
  });

  afterAll(() => {
    try { unlinkSync(tmpFile); } catch {}
    try { unlinkSync(tmpFile.replace('.json', '-sanitized.json')); } catch {}
  });

  it('should scan and detect sensitive memories', () => {
    const report = sanitizer.scanFile(tmpFile);

    expect(report.totalMemories).toBe(2);
    expect(report.sensitiveMemories.length).toBe(1);
    expect(report.sensitiveMemories[0].key).toBe('api_test');
  });

  it('should sanitize backup file', () => {
    const report = sanitizer.sanitizeFile(tmpFile);

    expect(report.memoriesScanned).toBe(2);
    expect(report.memoriesRedacted).toBe(1);
    expect(report.totalRedactions).toBeGreaterThan(0);
    expect(report.outputFile).toContain('sanitized');

    // Verify sanitized file exists
    const sanitized = JSON.parse(readFileSync(report.outputFile, 'utf-8'));
    expect(sanitized.data.cognitiveMemories).toHaveLength(2);

    // Clean memory should be unchanged
    const cleanMem = sanitized.data.cognitiveMemories.find(
      (m: any) => m.key === 'clean_memory'
    );
    expect(cleanMem.value).toBe('This is a clean memory with no sensitive data');
  });

  it('should sanitize data in memory', () => {
    const data = JSON.parse(readFileSync(tmpFile, 'utf-8'));
    const result = sanitizer.sanitizeData(data);

    expect(result.memoriesScanned).toBe(2);
    expect(result.memoriesRedacted).toBe(1);
  });
});
