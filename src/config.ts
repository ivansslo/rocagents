import { SystemConfig } from './types.js';
import { Redactor } from './redactor.js';

// ============================================================
// Config - Environment-based credentials (never in JSON)
// ============================================================

export class Config {
  private config: SystemConfig;
  private redactor: Redactor;

  constructor() {
    this.redactor = new Redactor();
    this.config = this.loadFromEnv();
  }

  private loadFromEnv(): SystemConfig {
    return {
      neonEndpoint: process.env.NEON_ENDPOINT || undefined,
      neonApiKey: process.env.NEON_API_KEY || undefined,
      ociIpAddress: process.env.OCI_IP_ADDRESS || undefined,
      tailscaleApiKey: process.env.TAILSCALE_API_KEY || undefined,
      backboardApiKey: process.env.BACKBOARD_API_KEY || undefined,
      honchoApiKey: process.env.HONCHO_API_KEY || undefined,
    };
  }

  get(): Readonly<SystemConfig> {
    return { ...this.config };
  }

  getRedacted(): SystemConfig {
    return this.redactor.redactObject(this.config as unknown as Record<string, unknown>) as unknown as SystemConfig;
  }

  validate(): { valid: boolean; missing: string[]; warnings: string[] } {
    const missing: string[] = [];
    const warnings: string[] = [];

    if (!this.config.neonEndpoint) missing.push('NEON_ENDPOINT');
    if (!this.config.neonApiKey) missing.push('NEON_API_KEY');
    if (!this.config.ociIpAddress) warnings.push('OCI_IP_ADDRESS (optional)');
    if (!this.config.tailscaleApiKey) warnings.push('TAILSCALE_API_KEY (optional)');
    if (!this.config.backboardApiKey) warnings.push('BACKBOARD_API_KEY (optional)');
    if (!this.config.honchoApiKey) warnings.push('HONCHO_API_KEY (optional)');

    return { valid: missing.length === 0, missing, warnings };
  }

  hasRequired(): boolean {
    return !!(this.config.neonEndpoint && this.config.neonApiKey);
  }

  isConfigured(): boolean {
    return Object.values(this.config).some((v) => v !== undefined);
  }
}

// ============================================================
// ConfigTemplate - Generate .env template
// ============================================================

export class ConfigTemplate {
  static generate(): string {
    return `# ============================================================
# RoC Agent Configuration
# Copy to .env and fill in your values
# NEVER commit .env to version control
# ============================================================

# --- Required ---
NEON_ENDPOINT=
NEON_API_KEY=

# --- Optional: Infrastructure ---
OCI_IP_ADDRESS=
TAILSCALE_API_KEY=

# --- Optional: Integrations ---
BACKBOARD_API_KEY=
HONCHO_API_KEY=
`;
  }

  static generateSecure(): string {
    return `# ============================================================
# RoC Agent Configuration (Secure Template)
# All values are placeholders - replace with real credentials
# ============================================================

# Neon PostgreSQL
NEON_ENDPOINT=ep-xxxxx.region.aws.neon.tech
NEON_API_KEY=neon_api_key_here

# OCI (Oracle Cloud)
OCI_IP_ADDRESS=0.0.0.0

# Tailscale
TAILSCALE_API_KEY=tskey-auth-xxxxx

# Backboard.io
BACKBOARD_API_KEY=backboard_key_here

# Honcho Memory
HONCHO_API_KEY=honcho_key_here
`;
  }
}
