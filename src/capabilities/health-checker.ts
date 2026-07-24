import { ServiceHealth, ServiceName } from '../types.js';

// ============================================================
// HealthChecker - Real service health monitoring
// ============================================================

export class HealthChecker {
  private checkHistory: Map<ServiceName, ServiceHealth[]> = new Map();

  async checkHttpEndpoint(url: string, timeoutMs = 5000): Promise<ServiceHealth> {
    const service = this.inferService(url);
    const start = Date.now();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        method: 'HEAD',
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const health: ServiceHealth = {
        service,
        status: response.ok ? 'online' : 'degraded',
        lastChecked: new Date().toISOString(),
        responseMs: Date.now() - start,
      };

      this.record(health);
      return health;
    } catch (error) {
      const health: ServiceHealth = {
        service,
        status: 'offline',
        lastChecked: new Date().toISOString(),
        responseMs: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      this.record(health);
      return health;
    }
  }

  async checkTcpPort(host: string, port: number, timeoutMs = 3000): Promise<ServiceHealth> {
    const service = this.inferService(host);
    const start = Date.now();

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), timeoutMs);

      // Use fetch with no-cors to test TCP connectivity
      await fetch(`http://${host}:${port}`, {
        method: 'HEAD',
        mode: 'no-cors',
        signal: controller.signal,
      });

      clearTimeout(timeout);

      const health: ServiceHealth = {
        service,
        status: 'online',
        lastChecked: new Date().toISOString(),
        responseMs: Date.now() - start,
      };

      this.record(health);
      return health;
    } catch (error) {
      const health: ServiceHealth = {
        service,
        status: 'offline',
        lastChecked: new Date().toISOString(),
        responseMs: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };

      this.record(health);
      return health;
    }
  }

  async checkAll(endpoints: { url?: string; host?: string; port?: number }[]): Promise<ServiceHealth[]> {
    const checks = endpoints.map((ep) => {
      if (ep.url) return this.checkHttpEndpoint(ep.url);
      if (ep.host && ep.port) return this.checkTcpPort(ep.host, ep.port);
      return Promise.resolve({
        service: 'unknown' as ServiceName,
        status: 'unknown' as const,
        lastChecked: new Date().toISOString(),
      });
    });

    return Promise.all(checks);
  }

  getHistory(service: ServiceName): ServiceHealth[] {
    return this.checkHistory.get(service) || [];
  }

  getLatestStatus(service: ServiceName): ServiceHealth | null {
    const history = this.checkHistory.get(service);
    return history && history.length > 0 ? history[history.length - 1] : null;
  }

  // --- Private ---

  private inferService(identifier: string): ServiceName {
    const lower = identifier.toLowerCase();
    if (lower.includes('neon') || lower.includes('postgres')) return 'neon';
    if (lower.includes('oci') || lower.includes('oracle')) return 'oci';
    if (lower.includes('tailscale')) return 'tailscale';
    if (lower.includes('backboard')) return 'backboard';
    if (lower.includes('honcho')) return 'honcho';
    return 'unknown' as ServiceName;
  }

  private record(health: ServiceHealth): void {
    const history = this.checkHistory.get(health.service) || [];
    history.push(health);
    // Keep last 100 checks per service
    if (history.length > 100) history.shift();
    this.checkHistory.set(health.service, history);
  }
}
